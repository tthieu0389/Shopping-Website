const knex = require("../database/knex");
const { _calculateOrderAmount } = require("./order.service");
const orderItemService = require("./orderitem.service");
const inventoryService = require("./inventory.service");
const generateOrderCode = require("../utils/generateOrderCode");

// Helper Lấy hoặc tạo giỏ hàng
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

    // FIX: Check tồn kho trước khi thêm vào giỏ
    const inventory = await trx("inventory").where({ product_id }).first();

    if (!inventory || inventory.quantity <= 0) {
      const err = new Error(`Sản phẩm "${product.name}" đã hết hàng`);
      err.statusCode = 400;
      throw err;
    }

    const cart = await getOrCreateCart(user_id, trx);
    const existing = await trx("cart_items")
      .where({ cart_id: cart.id, product_id })
      .first();

    const newQuantity = existing ? existing.quantity + quantity : quantity;

    if (newQuantity > inventory.quantity) {
      const err = new Error(
        `Sản phẩm "${product.name}" chỉ còn ${inventory.quantity} trong kho`,
      );
      err.statusCode = 400;
      throw err;
    }

    if (existing) {
      return trx("cart_items")
        .where({ id: existing.id })
        .update({
          quantity: newQuantity,
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
  // FIX: Check tồn kho trước khi cập nhật số lượng
  return knex.transaction(async (trx) => {
    const cartItem = await trx("cart_items").where({ id: item_id }).first();
    if (!cartItem) {
      const err = new Error("Cart item not found");
      err.statusCode = 404;
      throw err;
    }

    if (quantity <= 0) {
      const err = new Error("Số lượng phải lớn hơn 0");
      err.statusCode = 400;
      throw err;
    }

    const inventory = await trx("inventory")
      .where({ product_id: cartItem.product_id })
      .first();

    if (!inventory || inventory.quantity <= 0) {
      const err = new Error("Sản phẩm đã hết hàng");
      err.statusCode = 400;
      throw err;
    }

    if (quantity > inventory.quantity) {
      const err = new Error(`Chỉ còn ${inventory.quantity} sản phẩm trong kho`);
      err.statusCode = 400;
      throw err;
    }

    return trx("cart_items")
      .where({ id: item_id })
      .update({ quantity, updated_at: trx.fn.now() })
      .returning("*");
  });
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

    // _calculateOrderAmount đã có forUpdate lock + check tồn kho bên trong
    const calcResult = await _calculateOrderAmount(
      selectedItems,
      data.address_id,
      data.pickup_store_id,
      trx,
      user_id,
    );

    const [order] = await trx("orders")
      .insert({
        order_code: generateOrderCode(user_id),
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

    await trx("cart_items")
      .where({ cart_id: cart.id, is_selected: true })
      .del();
    return { ...order, order_details: calcResult };
  });
};
