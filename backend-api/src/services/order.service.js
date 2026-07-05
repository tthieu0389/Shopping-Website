const knex = require("../database/knex");
const orderItemService = require("./orderitem.service");
const promotionService = require("./promotion.service");
const inventoryService = require("./inventory.service");
const contactService = require("./contact.service");
const generateOrderCode = require("../utils/generateOrderCode");
const { normalizeKeyword } = require("../utils/searchKeyword");

// Ham tinh toan noi bo (Da toi uu hoa truy van batch)
const calculateOrderAmount = async (
  items,
  addressId = null,
  pickupStoreId = null,
  trx = knex,
  userId = null,
  options = {},
) => {
  // throwOnUnavailable = true (mặc định): dùng cho checkout/createOrder — phải
  // chặn cứng, không cho đặt hàng khi có item hết hàng/không đủ số lượng.
  // throwOnUnavailable = false: dùng cho xem giỏ hàng/preview — item lỗi chỉ
  // bị đánh dấu is_available=false, KHÔNG throw để tránh sập cả response và
  // kéo theo mất luôn các item khác không liên quan trong giỏ.
  const { throwOnUnavailable = true } = options;
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
      if (throwOnUnavailable) {
        const err = new Error(`Product ${item.product_id} not found`);
        err.statusCode = 404;
        throw err;
      }
      processedItems.push({
        product_id: item.product_id,
        product_name: null,
        quantity: item.quantity,
        is_available: false,
        stock: 0,
        unavailable_reason: "Sản phẩm không còn tồn tại",
      });
      continue;
    }

    const inventory = inventoryMap.get(item.product_id);
    if (!inventory) {
      if (throwOnUnavailable) {
        const err = new Error(
          `Không tìm thấy thông tin tồn kho cho sản phẩm "${product.name}"`,
        );
        err.statusCode = 400;
        throw err;
      }
      processedItems.push({
        product_id: product.id,
        product_name: product.name,
        image_url: imageMap.get(item.product_id) || null,
        quantity: item.quantity,
        // Vẫn giữ giá gốc để FE hiển thị đúng giá cũ (gạch ngang) thay vì
        // hiện "0đ" — sản phẩm chưa mất, chỉ là chưa có dòng tồn kho.
        unit_price: Number(product.price),
        base_price: Number(product.price) * item.quantity,
        is_available: false,
        stock: 0,
        unavailable_reason: "Sản phẩm chưa có thông tin tồn kho",
      });
      continue;
    }

    if (inventory.status !== "active") {
      if (throwOnUnavailable) {
        const err = new Error(
          `Sản phẩm "${product.name}" hiện đã ngừng kinh doanh`,
        );
        err.statusCode = 400;
        throw err;
      }
      processedItems.push({
        product_id: product.id,
        product_name: product.name,
        image_url: imageMap.get(item.product_id) || null,
        quantity: item.quantity,
        unit_price: Number(product.price),
        base_price: Number(product.price) * item.quantity,
        is_available: false,
        stock: inventory.quantity,
        unavailable_reason: "Sản phẩm hiện đã ngừng kinh doanh",
      });
      continue;
    }

    if (inventory.quantity < item.quantity) {
      if (throwOnUnavailable) {
        const err = new Error(
          `Sản phẩm "${product.name}" không đủ số lượng (còn ${inventory.quantity}, cần ${item.quantity})`,
        );
        err.statusCode = 400;
        throw err;
      }
      processedItems.push({
        product_id: product.id,
        product_name: product.name,
        image_url: imageMap.get(item.product_id) || null,
        quantity: item.quantity,
        // Giữ giá gốc — item hết hàng vẫn phải hiện đúng giá cũ, không phải 0đ.
        unit_price: Number(product.price),
        base_price: Number(product.price) * item.quantity,
        is_available: inventory.quantity > 0,
        stock: inventory.quantity,
        unavailable_reason:
          inventory.quantity <= 0
            ? "Sản phẩm đã hết hàng"
            : `Chỉ còn ${inventory.quantity} sản phẩm trong kho`,
      });
      continue;
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
      is_available: true,
      stock: inventory.quantity,
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
        payment_status: "unpaid",
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

    // Neu don da thanh toan roi moi bi huy -> can hoan tien, chuyen sang refunded
    // (khong tu dong tra tien that, chi phan anh trang thai can xu ly hoan tien)
    // Neu don chua thanh toan (unpaid/failed) -> huy coi nhu giao dich thanh toan
    // that bai, chuyen thang sang failed de phan anh dung trang thai cuoi cung.
    const cancelData = { status: "cancelled" };
    if (order.payment_status === "paid") {
      cancelData.payment_status = "refunded";
    } else if (order.payment_status !== "failed") {
      cancelData.payment_status = "failed";
    }

    await trx("orders").where("id", orderId).update(cancelData);
    return true;
  });
};

// Lay danh sach tat ca don hang cho ADMIN and STAFF (phan trang + bo loc)
exports.getAllOrders = async ({ limit = 10, offset = 0, filters = {} }) => {
  let query = knex("orders as o")
    .leftJoin("users as staff", "o.created_by_staff_id", "staff.id")
    .leftJoin("users as customer", "o.user_id", "customer.id");
  let countQuery = knex("orders as o").leftJoin(
    "users as customer",
    "o.user_id",
    "customer.id",
  );

  if (filters.status) {
    query.where("o.status", filters.status);
    countQuery.where("o.status", filters.status);
  }

  if (filters.payment_method) {
    query.where("o.payment_method", filters.payment_method);
    countQuery.where("o.payment_method", filters.payment_method);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);

    query.whereBetween("o.created_at", [start, end]);
    countQuery.whereBetween("o.created_at", [start, end]);
  }

  const searchKw = normalizeKeyword(filters.search);
  if (searchKw) {
    const keyword = `%${searchKw}%`;
    const applySearch = (qb) => {
      qb.where("o.order_code", "ilike", keyword)
        .orWhere("o.receiver_name", "ilike", keyword)
        .orWhere("o.receiver_phone", "ilike", keyword)
        .orWhere("customer.name", "ilike", keyword)
        .orWhere("customer.email", "ilike", keyword);
    };
    query.where(applySearch);
    countQuery.where(applySearch);
  }

  const totalRow = await countQuery.count("* as count").first();
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
  let query = knex("orders as o")
    .leftJoin("users as staff", "o.created_by_staff_id", "staff.id")
    .leftJoin("users as customer", "o.user_id", "customer.id")
    .where("o.user_id", userId);
  let countQuery = knex("orders as o")
    .leftJoin("users as customer", "o.user_id", "customer.id")
    .where("o.user_id", userId);

  if (filters.status) {
    query.where("o.status", filters.status);
    countQuery.where("o.status", filters.status);
  }

  if (filters.payment_method) {
    query.where("o.payment_method", filters.payment_method);
    countQuery.where("o.payment_method", filters.payment_method);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    query.whereBetween("o.created_at", [start, end]);
    countQuery.whereBetween("o.created_at", [start, end]);
  }

  const searchKw = normalizeKeyword(filters.search);
  if (searchKw) {
    const keyword = `%${searchKw}%`;
    const applySearch = (qb) => {
      qb.where("o.order_code", "ilike", keyword)
        .orWhere("o.receiver_name", "ilike", keyword)
        .orWhere("o.receiver_phone", "ilike", keyword)
        .orWhere("customer.name", "ilike", keyword)
        .orWhere("customer.email", "ilike", keyword);
    };
    query.where(applySearch);
    countQuery.where(applySearch);
  }

  const totalRow = await countQuery.count("* as count").first();
  const data = await query
    .select("o.*", "staff.name as created_by_staff_name")
    .orderBy("o.created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// Danh sach rieng cho staff: don staff tu mua (voi tu cach khach hang)
// HOAC don staff tao ho cho khach hang khac
exports.getOrdersByStaff = async ({
  staffId,
  limit = 10,
  offset = 0,
  filters = {},
}) => {
  const applyOwnerFilter = (qb) => {
    qb.where("o.user_id", staffId).orWhere("o.created_by_staff_id", staffId);
  };

  let query = knex("orders as o")
    .leftJoin("users as staff", "o.created_by_staff_id", "staff.id")
    .leftJoin("users as customer", "o.user_id", "customer.id")
    .where(applyOwnerFilter);
  let countQuery = knex("orders as o")
    .leftJoin("users as customer", "o.user_id", "customer.id")
    .where(applyOwnerFilter);

  if (filters.status) {
    query.where("o.status", filters.status);
    countQuery.where("o.status", filters.status);
  }

  if (filters.payment_method) {
    query.where("o.payment_method", filters.payment_method);
    countQuery.where("o.payment_method", filters.payment_method);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    query.whereBetween("o.created_at", [start, end]);
    countQuery.whereBetween("o.created_at", [start, end]);
  }

  const searchKw = normalizeKeyword(filters.search);
  if (searchKw) {
    const keyword = `%${searchKw}%`;
    const applySearch = (qb) => {
      qb.where("o.order_code", "ilike", keyword)
        .orWhere("o.receiver_name", "ilike", keyword)
        .orWhere("o.receiver_phone", "ilike", keyword)
        .orWhere("customer.name", "ilike", keyword)
        .orWhere("customer.email", "ilike", keyword);
    };
    query.where(applySearch);
    countQuery.where(applySearch);
  }

  const totalRow = await countQuery.count("* as count").first();
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
    orderItemService.getOrderItemsByOrderId(id),
    contactService.getContactsByOrder(id).catch((err) => {
      console.error(`getContactsByOrder failed for order ${id}:`, err);
      return [];
    }),
  ]);

  // Gắn cờ has_reviewed cho từng item
  // chỉ có khi đơn đã hoàn tất, vì đó là điều kiện bắt buộc để được đánh giá sản phẩm
  // Lưu ý: reviews là UNIQUE(user_id, product_id) — không phân biệt theo đơn hàng,
  //        nên has_reviewed = true nếu user đã review sản phẩm này ở BẤT KỲ đơn nào.
  if (order.status === "completed" && order.user_id && items.length > 0) {
    const productIds = [...new Set(items.map((it) => it.product_id))];
    const reviewed = await knex("reviews")
      .where({ user_id: order.user_id, is_deleted: false })
      .whereIn("product_id", productIds)
      .pluck("product_id");
    const reviewedSet = new Set(reviewed);
    items.forEach((it) => {
      it.has_reviewed = reviewedSet.has(it.product_id);
    });
  } else {
    items.forEach((it) => {
      it.has_reviewed = false;
    });
  }

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

    // Don khong phai COD (card/wallet) bat buoc phai thanh toan xong moi duoc hoan thanh
    // Don COD thi thu tien khi giao nen khong bat buoc paid truoc khi completed
    if (
      nextStatus === "completed" &&
      currentOrder.payment_method !== "cod" &&
      currentOrder.payment_status !== "paid"
    ) {
      const err = new Error(
        "Đơn hàng chưa thanh toán, không thể chuyển sang trạng thái hoàn thành",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const [updatedOrder] = await knex("orders")
    .where("id", id)
    .update(cleanData)
    .returning("*");
  return updatedOrder;
};

// Cap nhat trang thai thanh toan (tach rieng khoi status don hang)
exports.updatePaymentStatus = async (id, paymentStatus) => {
  if (!id || isNaN(id)) return null;

  const order = await knex("orders").where("id", id).first();
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  // Rang buoc chuyen trang thai thanh toan hop le
  const validPaymentTransitions = {
    unpaid: ["paid", "failed"],
    failed: ["unpaid", "paid"],
    paid: ["refunded"],
    refunded: [],
  };

  // NULL/undefined coi như "unpaid"
  // tránh việc validTransitions[undefined] ra [] rồi chặn nhầm mọi transition hợp lệ
  const currentPaymentStatus = order.payment_status || "unpaid";

  if (currentPaymentStatus !== paymentStatus) {
    const allowed = validPaymentTransitions[currentPaymentStatus] || [];
    if (!allowed.includes(paymentStatus)) {
      const err = new Error(
        `Invalid payment status transition: ${currentPaymentStatus} -> ${paymentStatus}`,
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Khong cho chuyen sang paid neu don da huy (khong co y nghia nghiep vu)
  if (paymentStatus === "paid" && order.status === "cancelled") {
    const err = new Error(
      "Không thể đánh dấu đã thanh toán cho đơn hàng đã hủy",
    );
    err.statusCode = 400;
    throw err;
  }

  // Don dang giao (shipping) chua the hoan tien - hang chua ve, chua xac dinh
  // duoc co huy/tra hang thanh cong hay khong. Chi hoan tien khi don da huy
  // hoac da giao thanh cong (completed).
  if (paymentStatus === "refunded" && order.status === "shipping") {
    const err = new Error(
      "Đơn hàng đang giao, không thể chuyển trạng thái thanh toán sang hoàn tiền",
    );
    err.statusCode = 400;
    throw err;
  }

  const [updatedOrder] = await knex("orders")
    .where("id", id)
    .update({ payment_status: paymentStatus })
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
