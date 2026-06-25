const knex = require("../database/knex");
const { _calculateOrderAmount } = require("./order.service");

// Lấy hoặc tạo giỏ hàng cho user
const getOrCreateCart = async (user_id, trx = knex) => {
  if (!user_id) throw new Error("User ID is required");

  let cart = await trx("carts").where({ user_id }).first();
  if (!cart) {
    [cart] = await trx("carts").insert({ user_id }).returning("*");
  }
  return cart;
};

// Thêm sản phẩm vào giỏ
exports.addToCart = async (user_id, product_id, quantity) => {
  return knex.transaction(async (trx) => {
    const product = await trx("products")
      .where({ id: product_id, is_deleted: false })
      .first();
    if (!product) throw new Error("Product not found");

    const cart = await getOrCreateCart(user_id, trx);
    const existing = await trx("cart_items")
      .where({ cart_id: cart.id, product_id })
      .first();

    if (existing) {
      return trx("cart_items")
        .where({ id: existing.id })
        .update({
          quantity: existing.quantity + quantity,
          updated_at: trx.fn.now(),
        })
        .returning("*");
    }

    return trx("cart_items")
      .insert({ cart_id: cart.id, product_id, quantity, is_selected: false })
      .returning("*");
  });
};

// Lấy giỏ hàng kèm trạng thái tick chọn và giá trị tạm tính
exports.getCartItems = async (user_id) => {
  const cart = await getOrCreateCart(user_id);
  const rawItems = await knex("cart_items").where("cart_id", cart.id);

  if (rawItems.length === 0) return { items: [], total_final_amount: 0 };

  const calculated = await _calculateOrderAmount(rawItems);

  // Map thêm thông tin is_selected từ DB vào kết quả
  calculated.items = calculated.items.map((item) => {
    const rawMatch = rawItems.find((r) => r.product_id === item.product_id);
    return {
      id: rawMatch.id,
      is_selected: rawMatch.is_selected,
      ...item,
    };
  });
  return calculated;
};

// API Preview: Tính tiền các món được chọn (Dùng cho Frontend hiển thị trước khi đặt hàng)
exports.previewCart = async (user_id, data) => {
  const cart = await getOrCreateCart(user_id);

  // Chỉ lấy các món người dùng đã tick chọn
  const selectedItems = await knex("cart_items").where({
    cart_id: cart.id,
    is_selected: true,
  });

  if (selectedItems.length === 0)
    throw new Error("Chưa chọn sản phẩm để tính toán");

  return await _calculateOrderAmount(
    selectedItems,
    data.address_id,
    data.pickup_store_id,
  );
};

// Update trạng thái Tick (Chọn/Bỏ chọn sản phẩm)
exports.toggleSelectItem = async (item_id, is_selected) => {
  return knex("cart_items").where({ id: item_id }).update({ is_selected });
};

// Update số lượng sản phẩm
exports.updateItem = async (item_id, quantity) => {
  return knex("cart_items").where({ id: item_id }).update({ quantity });
};

// Xóa 1 món khỏi giỏ
exports.removeItem = async (item_id) => {
  if (!item_id) throw new Error("Item ID required");
  return knex("cart_items").where({ id: item_id }).del();
};

// Xóa sạch giỏ hàng
exports.clearCart = async (user_id) => {
  const cart = await getOrCreateCart(user_id);
  return knex("cart_items").where({ cart_id: cart.id }).del();
};

// Thanh toán thật (Chỉ xử lý các món is_selected = true)
exports.checkout = async (user_id, data) => {
  return knex.transaction(async (trx) => {
    const cart = await trx("carts").where({ user_id }).first();

    // Chỉ lấy món được tick
    const selectedItems = await trx("cart_items").where({
      cart_id: cart.id,
      is_selected: true,
    });

    if (selectedItems.length === 0)
      throw new Error("Chưa chọn sản phẩm để thanh toán");

    const calcResult = await _calculateOrderAmount(
      selectedItems,
      data.address_id,
      data.pickup_store_id,
      trx,
    );

    // Tạo Order
    const [order] = await trx("orders")
      .insert({
        order_code: `ORD-${Date.now()}-${user_id}`,
        user_id,
        total_amount: calcResult.total_final_amount,
        status: "pending",
        receiver_name: calcResult.shipping_details?.receiver_name || null,
        receiver_phone: calcResult.shipping_details?.receiver_phone || null,
        shipping_address: calcResult.shipping_details?.shipping_address || null,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,
      })
      .returning("*");

    // Insert order_items & Trừ kho
    for (const item of calcResult.items) {
      await trx("inventory")
        .where({ product_id: item.product_id })
        .decrement("quantity", item.quantity);
      await trx("order_items").insert({ order_id: order.id, ...item });
    }

    // Xóa những món đã mua thành công khỏi giỏ hàng
    await trx("cart_items")
      .where({ cart_id: cart.id, is_selected: true })
      .del();

    return { ...order, order_details: calcResult };
  });
};
