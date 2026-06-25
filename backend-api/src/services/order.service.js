const knex = require("../database/knex");
const orderItemService = require("./orderitem.service");
const promotionService = require("./promotion.service");
const inventoryService = require("./inventory.service");

// Ham tinh toan noi bo: Tinh tien hang, khuyen mai, phi ship va snapshot thong tin giao hang
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
  let shippingDetails = null; // Biến này sẽ chứa dữ liệu snapshot
  const processedItems = [];

  // 1. Tinh toan tien hang va ap dung khuyen mai
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

  // 2. Logic tinh phi van chuyen va lay snapshot thong tin
  if (addressId) {
    const address = await trx("user_addresses")
      .where({ id: addressId })
      .first();
    if (!address) {
      const err = new Error("Dia chi giao hang khong ton tai");
      err.statusCode = 404;
      throw err;
    }

    // Luu thong tin vao bien snapshot
    shippingDetails = {
      receiver_name: address.receiver_name,
      receiver_phone: address.phone,
      shipping_address: `${address.address_line}, ${address.ward}, ${address.district}, ${address.province}`,
    };

    const storeInSameProvince = await trx("stores")
      .where({ province: address.province, is_deleted: false })
      .first();

    shippingFee = storeInSameProvince ? 15000 : 25000;
  } else if (pickupStoreId) {
    const store = await trx("stores")
      .where({ id: pickupStoreId, is_deleted: false })
      .first();
    if (!store) {
      const err = new Error("Cua hang da chon khong ton tai hoac da dong cua");
      err.statusCode = 404;
      throw err;
    }
    shippingFee = 0;
  }

  totalFinalAmount += shippingFee;

  return {
    items: processedItems,
    shipping_fee: shippingFee,
    shipping_details: shippingDetails, // Trả về snapshot info
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
    // Validate du lieu co ban
    if (!data.items || data.items.length === 0) {
      const err = new Error("Cart cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    if (!data.address_id && !data.pickup_store_id) {
      const err = new Error(
        "Vui long chon dia chi giao hang hoac cua hang nhan hang!",
      );
      err.statusCode = 400;
      throw err;
    }

    if (data.address_id && data.pickup_store_id) {
      const err = new Error("Chi duoc chon mot trong hai hinh thuc nhan hang!");
      err.statusCode = 400;
      throw err;
    }

    // Tinh toan tien hang, phi ship va lay snapshot thong tin nguoi nhan
    const calcResult = await calculateOrderAmount(
      data.items,
      data.address_id,
      data.pickup_store_id,
      trx,
    );

    // Luu don hang vao DB
    const [order] = await trx("orders")
      .insert({
        order_code: `ORD-${Date.now()}-${userId}`,
        user_id: userId,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,

        // Luu thong tin Snapshot vao bang orders
        receiver_name: calcResult.shipping_details?.receiver_name || null,
        receiver_phone: calcResult.shipping_details?.receiver_phone || null,
        shipping_address: calcResult.shipping_details?.shipping_address || null,

        payment_method: data.payment_method || "cod",
        note: data.note || null,
        status: "pending",
        shipping_fee: calcResult.shipping_fee,
        total_amount: calcResult.total_final_amount,
      })
      .returning("*");

    // Tru kho va luu chi tiet tung mat hang
    for (const item of calcResult.items) {
      await inventoryService.decreaseStock(
        trx,
        item.product_id,
        item.quantity,
        order.id,
      );

      // Gọi qua service để kích hoạt tự động
      await orderItemService.createOrderItem(trx, {
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        base_price: item.base_price,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        final_price: item.final_price,
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
