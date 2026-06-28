const knex = require("../database/knex");
const { _calculateOrderAmount } = require("./order.service");
const orderItemService = require("./orderitem.service");
const inventoryService = require("./inventory.service");

// Helper: Lấy hoặc tạo giỏ hàng
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

// Lấy danh sách sản phẩm trong giỏ
exports.getCartItems = async (user_id) => {
  const cart = await getOrCreateCart(user_id);
  const rawItems = await knex("cart_items").where("cart_id", cart.id);
  if (rawItems.length === 0) return { items: [], total_final_amount: 0 };

  const calculated = await _calculateOrderAmount(rawItems);
  calculated.items = calculated.items.map((item) => {
    const rawMatch = rawItems.find((r) => r.product_id === item.product_id);
    return { id: rawMatch.id, is_selected: rawMatch.is_selected, ...item };
  });
  return calculated;
};

// Xem trước chi phí (Preview)
exports.previewCart = async (user_id, data) => {
  const cart = await getOrCreateCart(user_id);
  const selectedItems = await knex("cart_items").where({
    cart_id: cart.id,
    is_selected: true,
  });

  if (selectedItems.length === 0) throw new Error("Chưa chọn sản phẩm");

  return await _calculateOrderAmount(
    selectedItems,
    data.address_id,
    data.pickup_store_id,
  );
};

// Thay đổi trạng thái chọn sản phẩm
exports.toggleSelectItem = async (item_id, is_selected) => {
  return knex("cart_items").where({ id: item_id }).update({ is_selected });
};

// Cập nhật số lượng
exports.updateItem = async (item_id, quantity) => {
  return knex("cart_items").where({ id: item_id }).update({ quantity });
};

// Xóa sản phẩm khỏi giỏ
exports.removeItem = async (item_id) => {
  if (!item_id) throw new Error("Item ID required");
  return knex("cart_items").where({ id: item_id }).del();
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (user_id) => {
  const cart = await knex("carts").where({ user_id }).first();
  if (!cart) return;
  return knex("cart_items").where({ cart_id: cart.id }).del();
};

// Xử lý thanh toán (Checkout)
exports.checkout = async (user_id, data) => {
  return knex.transaction(async (trx) => {
    const cart = await trx("carts").where({ user_id }).first();
    const selectedItems = await trx("cart_items").where({
      cart_id: cart.id,
      is_selected: true,
    });

    if (selectedItems.length === 0) throw new Error("Chưa chọn sản phẩm");

    // Tính toán số tiền
    const calcResult = await _calculateOrderAmount(
      selectedItems,
      data.address_id,
      data.pickup_store_id,
      trx,
      user_id,
    );

    // Tạo đơn hàng
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
        shipping_fee: calcResult.shipping_fee || 0,
        payment_method: data.payment_method || "cod",
        note: data.note || null,
      })
      .returning("*");

    // Trừ kho & Tạo chi tiết đơn hàng
    for (const item of calcResult.items) {
      await inventoryService.decreaseStock(
        trx,
        item.product_id,
        item.quantity,
        order.id,
      );

      // Tạo chi tiết đơn hàng
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

    // Xóa sản phẩm đã thanh toán khỏi giỏ hàng
    await trx("cart_items")
      .where({ cart_id: cart.id, is_selected: true })
      .del();
    return { ...order, order_details: calcResult };
  });
};
