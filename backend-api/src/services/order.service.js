const knex = require("../database/knex");
const orderItemService = require("./orderitem.service");
const promotionService = require("./promotion.service");
const inventoryService = require("./inventory.service");
const contactService = require("./contact.service");
const generateOrderCode = require("../utils/generateOrderCode");

// Ham tinh toan noi bo (Da toi uu hoa truy van batch)
const calculateOrderAmount = async (
  items,
  addressId = null,
  pickupStoreId = null,
  trx = knex,
  userId = null,
) => {
  // 1. Thu thap tat ca ID can thiet de truy van mot lan duy nhat
  const productIds = [...new Set(items.map((i) => i.product_id))];

  // Fetch tat ca du lieu lien quan trong 1 query
  const products = await trx("products")
    .whereIn("id", productIds)
    .andWhere({ is_deleted: false });

  const inventories = await trx("inventory")
    .whereIn("product_id", productIds)
    .forUpdate();

  // Fetch tat ca anh thumbnail trong 1 query
  const images = await trx("product_images")
    .whereIn("product_id", productIds)
    .orderBy("is_thumbnail", "desc");

  // Chuyen thanh Map de tra cuu nhanh trong O(1)
  const productMap = new Map(products.map((p) => [p.id, p]));
  const inventoryMap = new Map(inventories.map((i) => [i.product_id, i]));
  const imageMap = new Map();
  images.forEach((img) => {
    if (!imageMap.has(img.product_id))
      imageMap.set(img.product_id, img.image_url);
  });

  let totalBaseAmount = 0;
  let totalDiscountAmount = 0;
  let totalFinalAmount = 0;
  let shippingFee = 0;
  let shippingDetails = null;
  const processedItems = [];

  // 2. Tinh toan (Dung du lieu da fetch san, khong goi query them trong vong lap)
  for (const item of items) {
    if (!item.product_id || !item.quantity) {
      const err = new Error("Invalid item data");
      err.statusCode = 400;
      throw err;
    }

    const product = productMap.get(item.product_id);
    if (!product) {
      const err = new Error(`Product ${item.product_id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const inventory = inventoryMap.get(item.product_id);
    if (!inventory) {
      const err = new Error(
        `Không tìm thấy thông tin tồn kho cho sản phẩm "${product.name}"`,
      );
      err.statusCode = 400;
      throw err;
    }

    if (inventory.quantity < item.quantity) {
      const err = new Error(
        `Sản phẩm "${product.name}" không đủ số lượng (còn ${inventory.quantity}, cần ${item.quantity})`,
      );
      err.statusCode = 400;
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
      // Khong cho phep discount vuot qua gia tri don hang (tranh final_price < 0)
      discountAmount = Math.min(discountAmount, basePrice);
    }

    const finalPrice = basePrice - discountAmount;
    totalBaseAmount += basePrice;
    totalDiscountAmount += discountAmount;
    totalFinalAmount += finalPrice;

    processedItems.push({
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      image_url: imageMap.get(item.product_id) || null,
      quantity: item.quantity,
      unit_price: unitPrice,
      base_price: basePrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
    });
  }

  // 3. Logic tinh phi van chuyen
  if (addressId) {
    const address = await trx("user_addresses")
      .where({ id: addressId })
      .first();
    if (!address) {
      const err = new Error("Dia chi giao hang khong ton tai");
      err.statusCode = 404;
      throw err;
    }

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

    if (userId) {
      const user = await trx("users").where({ id: userId }).first();
      const profile = await trx("user_profiles")
        .where({ user_id: userId })
        .first();
      shippingDetails = {
        receiver_name: user?.name || null,
        receiver_phone: profile?.phone || null,
        shipping_address: store.address,
      };
    }

    shippingFee = 0;
  }

  totalFinalAmount += shippingFee;

  return {
    items: processedItems,
    shipping_fee: shippingFee,
    shipping_details: shippingDetails,
    total_base_amount: totalBaseAmount,
    total_discount_amount: totalDiscountAmount,
    total_final_amount: totalFinalAmount,
  };
};

exports._calculateOrderAmount = calculateOrderAmount;

// Preview don hang (Khong ghi DB, dung cho luong xem truoc gio hang / mua ngay)
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
exports.createOrder = async (userId, data, createdByStaffId = null) => {
  return knex.transaction(async (trx) => {
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

    // calculateOrderAmount da co forUpdate lock + check ton kho ben trong
    const calcResult = await calculateOrderAmount(
      data.items,
      data.address_id,
      data.pickup_store_id,
      trx,
      userId,
    );

    const [order] = await trx("orders")
      .insert({
        order_code: generateOrderCode(userId),
        user_id: userId,
        created_by_staff_id: createdByStaffId,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,
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

    for (const item of calcResult.items) {
      await inventoryService.decreaseStock(
        trx,
        item.product_id,
        item.quantity,
        order.id,
      );

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

exports.cancelOrder = async (orderId, userId, userRole) => {
  return knex.transaction(async (trx) => {
    const order = await trx("orders").where("id", orderId).first();

    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    // Chi admin hoac chu don hang moi duoc huy (staff chi huy duoc don chinh minh tao)
    if (
      userRole !== "admin" &&
      order.user_id !== userId &&
      order.created_by_staff_id !== userId
    ) {
      const err = new Error("Forbidden: bạn không có quyền hủy đơn này");
      err.statusCode = 403;
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

// Lay danh sach tat ca don hang cho ADMIN and STAFF (phan trang + bo loc + search)
exports.getAllOrders = async ({ limit = 10, offset = 0, filters = {} }) => {
  const buildBase = () =>
    knex("orders as o").leftJoin(
      "users as customer",
      "o.user_id",
      "customer.id",
    );

  let query = buildBase().leftJoin(
    "users as staff",
    "o.created_by_staff_id",
    "staff.id",
  );
  let countQuery = buildBase();

  const applyFilters = (qb) => {
    if (filters.status) {
      qb.where("o.status", filters.status);
    }

    // Giu logic cu: filter 1 ngay cu the
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      qb.whereBetween("o.created_at", [start, end]);
    }

    // Moi: search theo order_code, nguoi nhan, hoac khach hang (name/email)
    if (filters.search && filters.search.trim()) {
      const keyword = `%${filters.search.trim()}%`;
      qb.where((builder) => {
        builder
          .whereILike("o.order_code", keyword)
          .orWhereILike("o.receiver_name", keyword)
          .orWhereILike("o.receiver_phone", keyword)
          .orWhereILike("customer.name", keyword)
          .orWhereILike("customer.email", keyword);
      });
    }
  };

  applyFilters(query);
  applyFilters(countQuery);

  const totalRow = await countQuery.count("o.id as count").first();
  const data = await query
    .select("o.*", "staff.name as created_by_staff_name")
    .orderBy("o.created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// Lay danh sach don hang theo User ID (user thuong)
exports.getOrdersByUser = async ({
  userId,
  limit = 10,
  offset = 0,
  filters = {},
}) => {
  const buildBase = () => knex("orders as o").where("o.user_id", userId);

  let query = buildBase().leftJoin(
    "users as staff",
    "o.created_by_staff_id",
    "staff.id",
  );
  let countQuery = buildBase();

  const applyFilters = (qb) => {
    if (filters.status) {
      qb.where("o.status", filters.status);
    }

    // User da biet minh la ai roi nen chi can search theo don, khong can search ten khach
    if (filters.search && filters.search.trim()) {
      const keyword = `%${filters.search.trim()}%`;
      qb.where((builder) => {
        builder
          .whereILike("o.order_code", keyword)
          .orWhereILike("o.receiver_name", keyword)
          .orWhereILike("o.receiver_phone", keyword);
      });
    }
  };

  applyFilters(query);
  applyFilters(countQuery);

  const totalRow = await countQuery.count("o.id as count").first();
  const data = await query
    .select("o.*", "staff.name as created_by_staff_name")
    .orderBy("o.created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// Danh sach rieng cho staff: don staff tu mua HOAC don staff tao ho khach
exports.getOrdersByStaff = async ({
  staffId,
  limit = 10,
  offset = 0,
  filters = {},
}) => {
  const applyOwnerFilter = (qb) => {
    qb.where("o.user_id", staffId).orWhere("o.created_by_staff_id", staffId);
  };

  const buildBase = () =>
    knex("orders as o")
      .leftJoin("users as customer", "o.user_id", "customer.id")
      .where(applyOwnerFilter);

  let query = buildBase().leftJoin(
    "users as staff",
    "o.created_by_staff_id",
    "staff.id",
  );
  let countQuery = buildBase();

  const applyFilters = (qb) => {
    if (filters.status) {
      qb.where("o.status", filters.status);
    }

    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      qb.whereBetween("o.created_at", [start, end]);
    }

    if (filters.search && filters.search.trim()) {
      const keyword = `%${filters.search.trim()}%`;
      qb.where((builder) => {
        builder
          .whereILike("o.order_code", keyword)
          .orWhereILike("o.receiver_name", keyword)
          .orWhereILike("o.receiver_phone", keyword)
          .orWhereILike("customer.name", keyword)
          .orWhereILike("customer.email", keyword);
      });
    }
  };

  applyFilters(query);
  applyFilters(countQuery);

  const totalRow = await countQuery.count("o.id as count").first();
  const data = await query
    .select("o.*", "staff.name as created_by_staff_name")
    .orderBy("o.created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// Lay chi tiet 1 don hang (kem items + cac lien he (contacts) gan voi don nay)
exports.getOrderById = async (id) => {
  const order = await knex("orders as o")
    .leftJoin("users as staff", "o.created_by_staff_id", "staff.id")
    .select("o.*", "staff.name as created_by_staff_name")
    .where("o.id", id)
    .first();
  if (!order) return null;

  const [items, contacts] = await Promise.all([
    knex("order_items as oi")
      .select("oi.*")
      .select(
        knex("product_images")
          .select("image_url")
          .whereRaw("product_id = oi.product_id")
          .where("is_thumbnail", true)
          .limit(1)
          .as("image_url"),
      )
      .where("oi.order_id", id),
    contactService.getContactsByOrder(id).catch((err) => {
      console.error(`getContactsByOrder failed for order ${id}:`, err);
      return [];
    }),
  ]);

  order.items = items;
  order.contacts = contacts;
  return order;
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

// Xoa vinh vien don hang khoi DB (chi xoa duoc don da huy)
exports.deleteOrder = async (id) => {
  return knex.transaction(async (trx) => {
    const order = await trx("orders").where("id", id).first();
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (order.status !== "cancelled") {
      const err = new Error(
        "Chỉ có thể xóa đơn hàng đã hủy. Vui lòng hủy đơn trước.",
      );
      err.statusCode = 400;
      throw err;
    }

    return await trx("orders").where("id", id).del();
  });
};
