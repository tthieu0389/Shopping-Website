const knex = require("../database/knex");
const { _calculateOrderAmount } = require("./order.service"); // Import hàm tính toán dùng chung

// Lấy hoặc tự động tạo giỏ hàng cho tài khoản người dùng
const getOrCreateCart = async (user_id, trx = knex) => {
  // Chặn trường hợp user_id không hợp lệ (null, undefined, trống) khi frontend bị mất session
  if (!user_id) {
    const err = new Error(
      "Yêu cầu mã định danh người dùng (User ID is required)",
    );
    err.statusCode = 400;
    throw err;
  }

  let cart = await trx("carts").where({ user_id }).first();
  if (!cart) {
    [cart] = await trx("carts").insert({ user_id }).returning("*");
  }
  return cart;
};

// THÊM SẢN PHẨM VÀO GIỎ HÀNG
exports.addToCart = async (user_id, product_id, quantity) => {
  return knex.transaction(async (trx) => {
    const product = await trx("products")
      .where({ id: product_id, is_deleted: false })
      .first();
    if (!product) throw new Error("Product not found");

    const inventory = await trx("inventory").where({ product_id }).first();
    if (!inventory || inventory.quantity < quantity)
      throw new Error("Not enough stock");

    const cart = await getOrCreateCart(user_id, trx);
    const existing = await trx("cart_items")
      .where({ cart_id: cart.id, product_id })
      .first();

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (inventory.quantity < newQty)
        throw new Error("Not enough stock (cart total)");

      return trx("cart_items")
        .where({ id: existing.id })
        .update({ quantity: newQty, updated_at: trx.fn.now() })
        .returning("*")
        .then(([r]) => r);
    }

    const [item] = await trx("cart_items")
      .insert({ cart_id: cart.id, product_id, quantity })
      .returning("*");
    return item;
  });
};

// LẤY DANH SÁCH GIỎ HÀNG
exports.getCartItems = async (user_id) => {
  const cart = await getOrCreateCart(user_id);

  // Lấy các item thô trong DB ra trước kèm theo ID của cart_item
  const rawItems = await knex("cart_items")
    .where("cart_id", cart.id)
    .select("id as cart_item_id", "product_id", "quantity");

  if (rawItems.length === 0) {
    return {
      items: [],
      total_base_amount: 0,
      total_discount_amount: 0,
      total_final_amount: 0,
    };
  }

  // Chạy tính toán giá tiền, khuyến mãi của danh sách sản phẩm
  const calculated = await _calculateOrderAmount(rawItems);

  // Gộp id của cart_item vào danh sách kết quả trả về cho frontend sử dụng
  calculated.items = calculated.items.map((item) => {
    const rawMatch = rawItems.find((r) => r.product_id === item.product_id);
    return {
      id: rawMatch ? rawMatch.cart_item_id : null,
      ...item,
    };
  });

  return calculated;
};

// CẬP NHẬT SỐ LƯỢNG MỘT PHẦN TỬ TRONG GIỎ
exports.updateItem = async (item_id, quantity) => {
  return knex.transaction(async (trx) => {
    const item = await trx("cart_items").where({ id: item_id }).first();
    if (!item) throw new Error("Cart item not found");

    const inventory = await trx("inventory")
      .where({ product_id: item.product_id })
      .first();
    if (!inventory || inventory.quantity < quantity)
      throw new Error("Not enough stock");

    const [updated] = await trx("cart_items")
      .where({ id: item_id })
      .update({ quantity, updated_at: trx.fn.now() })
      .returning("*");

    return updated;
  });
};

// XÓA PHẦN TỬ KHỎI GIỎ HÀNG
exports.removeItem = async (item_id) => {
  return knex("cart_items").where({ id: item_id }).del();
};

// XÓA TRỐNG TOÀN BỘ GIỎ HÀNG
exports.clearCart = async (user_id) => {
  const cart = await knex("carts").where({ user_id }).first();
  if (!cart) return;
  return knex("cart_items").where({ cart_id: cart.id }).del();
};

// THANH TOÁN ĐƠN HÀNG (Từ giỏ hàng)
exports.checkout = async (user_id, data) => {
  return knex.transaction(async (trx) => {
    const cart = await trx("carts").where({ user_id }).first();
    if (!cart) throw new Error("Cart not found");

    const rawItems = await trx("cart_items")
      .where({ cart_id: cart.id })
      .select("product_id", "quantity");
    if (rawItems.length === 0) throw new Error("Cart is empty");

    const calcResult = await _calculateOrderAmount(rawItems, null, null, trx);

    const [order] = await trx("orders")
      .insert({
        order_code: `ORD-${Date.now()}-${user_id}`,
        user_id,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,
        payment_method: data.payment_method || "cod",
        note: data.note || null,
        status: "pending",
        total_amount: calcResult.total_final_amount,
      })
      .returning("*");

    for (const item of calcResult.items) {
      const updated = await trx("inventory")
        .where({ product_id: item.product_id })
        .andWhere("quantity", ">=", item.quantity)
        .decrement("quantity", item.quantity)
        .returning("*");

      if (!updated.length)
        throw new Error(`Not enough stock for product ${item.product_id}`);

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

    await trx("cart_items").where({ cart_id: cart.id }).del();

    return { ...order, order_details: calcResult };
  });
};
