const knex = require("../database/knex");
const orderItemService = require("./orderitem.service");
const promotionService = require("./promotion.service");
const inventoryService = require("./inventory.service");

// Ham tinh toan noi bo: Tinh tien hang, khuyen mai va phi ship
const calculateOrderAmount = async (
  items,
  addressId = null,
  pickupStoreId = null,
  trx = knex,
) => {
  let totalBaseAmount = 0;
  let totalDiscountAmount = 0;
  let totalFinalAmount = 0;
  let shippingFee = 0;
  const processedItems = [];

  // 1. Tinh toan tien hang va ap dung khuyen mai tot nhat
  for (const item of items) {
    if (!item.product_id || !item.quantity) {
      const err = new Error("Invalid item data");
      err.statusCode = 400;
      throw err;
    }

    const product = await trx("products")
      .where({ id: item.product_id, is_deleted: false })
      .first();

    if (!product) {
      const err = new Error(`Product ${item.product_id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const unitPrice = Number(product.price);
    const basePrice = unitPrice * item.quantity;
    let discountAmount = 0;

    const promotions = await promotionService.getBestPromotions(
      item.product_id,
      trx,
    );
    if (promotions && promotions.length > 0) {
      discountAmount =
        promotionService.calculateTotalDiscount(unitPrice, promotions) *
        item.quantity;
    }

    const finalPrice = basePrice - discountAmount;

    totalBaseAmount += basePrice;
    totalDiscountAmount += discountAmount;
    totalFinalAmount += finalPrice;

    processedItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      base_price: basePrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
    });
  }

  // 2. Logic tinh phi van chuyen dua tren hinh thuc nhan hang
  if (addressId) {
    const address = await trx("user_addresses")
      .where({ id: addressId })
      .first();
    if (!address) {
      const err = new Error("Dia chi giao hang khong ton tai");
      err.statusCode = 404;
      throw err;
    }

    // So sanh tinh cua khach voi he thong cua hang de phan loai phi ship
    const storeInSameProvince = await trx("stores")
      .where({ province: address.province, is_deleted: false })
      .first();

    if (storeInSameProvince) {
      shippingFee = 15000; // Phi noi tinh
    } else {
      shippingFee = 25000; // Phi ngoai tinh
    }
  } else if (pickupStoreId) {
    const store = await trx("stores")
      .where({ id: pickupStoreId, is_deleted: false })
      .first();
    if (!store) {
      const err = new Error("Cua hang da chon khong ton tai hoac da dong cua");
      err.statusCode = 404;
      throw err;
    }
    shippingFee = 0; // Nhan tai cua hang duoc mien phi ship
  }

  totalFinalAmount += shippingFee;

  return {
    items: processedItems,
    shipping_fee: shippingFee,
    total_base_amount: totalBaseAmount,
    total_discount_amount: totalDiscountAmount,
    total_final_amount: totalFinalAmount,
  };
};

exports._calculateOrderAmount = calculateOrderAmount;

// Preview don hang (Khong ghi DB, dung cho luong xem truoc giohang / muangay)
exports.previewOrder = async (data) => {
  if (!data.items || data.items.length === 0) {
    const err = new Error("Cart cannot be empty");
    err.statusCode = 400;
    throw err;
  }
  return await calculateOrderAmount(
    data.items,
    data.address_id,
    data.pickup_store_id,
  );
};

// Tao don hang moi (Chot don, tru kho va luu lich su)
exports.createOrder = async (userId, data) => {
  return knex.transaction(async (trx) => {
    if (!data.items || data.items.length === 0) {
      const err = new Error("Cart cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    if (!data.address_id && !data.pickup_store_id) {
      const err = new Error(
        "Vui long chon dia chi rieng hoac cua hang nhan hang!",
      );
      err.statusCode = 400;
      throw err;
    }

    if (data.address_id && data.pickup_store_id) {
      const err = new Error("Chi duoc chon mot trong hai hinh thuc nhan hang!");
      err.statusCode = 400;
      throw err;
    }

    const calcResult = await calculateOrderAmount(
      data.items,
      data.address_id,
      data.pickup_store_id,
      trx,
    );

    const [order] = await trx("orders")
      .insert({
        order_code: `ORD-${Date.now()}-${userId}`,
        user_id: userId,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,
        payment_method: data.payment_method || "cod",
        note: data.note || null,
        status: "pending",
        shipping_fee: calcResult.shipping_fee,
        total_amount: calcResult.total_final_amount,
      })
      .returning("*");

    for (const item of calcResult.items) {
      await inventoryService.decreaseStock(
        trx,
        item.product_id,
        item.quantity,
        order.id,
      );

      await trx("order_items").insert({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.unit_price,
        quantity: item.quantity,
        price: item.base_price,
        discount_amount: item.discount_amount,
      });
    }

    return {
      ...order,
      order_details: calcResult,
    };
  });
};

// Huy don hang va hoan lai so luong vao kho
exports.cancelOrder = async (orderId) => {
  return knex.transaction(async (trx) => {
    const order = await trx("orders").where("id", orderId).first();

    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      const err = new Error(
        "Only pending or confirmed orders can be cancelled",
      );
      err.statusCode = 400;
      throw err;
    }

    const items = await trx("order_items").where("order_id", orderId);
    for (const item of items) {
      await inventoryService.increaseStock(
        trx,
        item.product_id,
        item.quantity,
        orderId,
      );
    }

    await trx("orders").where("id", orderId).update({ status: "cancelled" });
    return true;
  });
};

// Lay danh sach tat ca don hang (Phan trang + Bo loc)
exports.getAllOrders = async ({ limit = 10, offset = 0, filters = {} }) => {
  let query = knex("orders");
  let countQuery = knex("orders");

  if (filters.status) {
    query.where("status", filters.status);
    countQuery.where("status", filters.status);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);

    query.whereBetween("created_at", [start, end]);
    countQuery.whereBetween("created_at", [start, end]);
  }

  const totalRow = await countQuery.count("* as count").first();
  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// Lay danh sach don hang theo User ID
exports.getOrdersByUser = async ({
  userId,
  limit = 10,
  offset = 0,
  filters = {},
}) => {
  let query = knex("orders").where("user_id", userId);
  let countQuery = knex("orders").where("user_id", userId);

  if (filters.status) {
    query.where("status", filters.status);
    countQuery.where("status", filters.status);
  }

  const totalRow = await countQuery.count("* as count").first();
  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// Cap nhat trang thai hoac ghi chu don hang (Check logic chuyen trang thai)
exports.updateOrder = async (id, data) => {
  if (!id || isNaN(id)) return null;

  const currentOrder = await knex("orders").where("id", id).first();
  if (!currentOrder) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ["status", "note"];
  const cleanData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cleanData[field] = data[field];
  }

  if (Object.keys(cleanData).length === 0) return null;

  if (cleanData.status === "cancelled") {
    const err = new Error(
      "Cannot set cancelled directly. Use cancelOrder() instead",
    );
    err.statusCode = 400;
    throw err;
  }

  const validTransitions = {
    pending: ["confirmed"],
    confirmed: ["shipping"],
    shipping: ["completed"],
    completed: [],
    cancelled: [],
  };

  if (cleanData.status) {
    const currentStatus = currentOrder.status;
    const nextStatus = cleanData.status;

    if (currentStatus !== nextStatus) {
      const allowed = validTransitions[currentStatus] || [];
      if (!allowed.includes(nextStatus)) {
        const err = new Error(
          `Invalid status transition: ${currentStatus} -> ${nextStatus}`,
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const [updatedOrder] = await knex("orders")
    .where("id", id)
    .update(cleanData)
    .returning("*");
  return updatedOrder;
};

// Xoa vinh vien don hang khoi DB
exports.deleteOrder = async (id) => {
  if (!id || isNaN(id)) return null;
  return knex("orders").where("id", id).del();
};

// Lay chi tiet mot don hang kem danh sach mat hang
exports.getOrderById = async (orderId) => {
  if (!orderId || isNaN(orderId)) return null;

  const order = await knex("orders").where("id", orderId).first();
  if (!order) return null;

  const items = await orderItemService.getOrderItemsByOrderId(orderId);
  return { ...order, items };
};
