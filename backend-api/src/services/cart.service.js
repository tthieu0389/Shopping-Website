const knex = require("../database/knex");
const { _calculateOrderAmount } = require("./order.service");
const orderItemService = require("./orderitem.service");
const inventoryService = require("./inventory.service");
const generateOrderCode = require("../utils/generateOrderCode");

// Helper lấy hoặc tạo giỏ hàng
const getOrCreateCart = async (user_id, trx = knex) => {
  if (!user_id) throw new Error("User ID is required");
  let cart = await trx("carts").where({ user_id }).first();
  if (!cart) {
    [cart] = await trx("carts").insert({ user_id }).returning("*");
  }
  return cart;
};

// Helper kiểm tra ownership của cart_item
const assertCartItemOwnership = async (item_id, user_id, trx = knex) => {
  const item = await trx("cart_items as ci")
    .join("carts as c", "ci.cart_id", "c.id")
    .where({ "ci.id": item_id, "c.user_id": user_id })
    .select("ci.*")
    .first();

  if (!item) {
    const err = new Error("Cart item not found");
    err.statusCode = 404;
    throw err;
  }
  return item;
};

// Thêm sản phẩm vào giỏ
exports.addToCart = async (user_id, product_id, quantity) => {
  return knex.transaction(async (trx) => {
    const product = await trx("products")
      .where({ id: product_id, is_deleted: false })
      .first();
    if (!product) throw new Error("Product not found");

    const inventory = await trx("inventory").where({ product_id }).first();

    if (
      !inventory ||
      inventory.status !== "active" ||
      inventory.quantity <= 0
    ) {
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

  // Truyền user_id để tính toán phí vận chuyển chính xác nếu có địa chỉ mặc định/thông tin user
  // throwOnUnavailable: false — chỉ xem giỏ hàng, không được throw làm sập cả
  // response khi có 1 item hết hàng (sẽ kéo theo các item khác không liên quan
  // "biến mất" khỏi mắt FE dù dữ liệu DB vẫn còn nguyên). Item hết hàng sẽ
  // được đánh dấu is_available:false để FE tự hiển thị xám/"Hết hàng".
  const calculated = await _calculateOrderAmount(
    rawItems,
    null,
    null,
    knex,
    user_id,
    { throwOnUnavailable: false },
  );

  // Item hết hàng (is_available=false) mà qty giỏ > 1 thì reset về 1
  // Lock từng dòng trước khi update, re-check sau lock để tránh đụng độ
  // với updateItem()/checkout() đang chạy song song.
  const staleIds = calculated.items
    .filter((ci) => !ci.is_available)
    .map((ci) => rawItems.find((r) => r.product_id === ci.product_id))
    .filter((raw) => raw && raw.quantity > 1)
    .map((raw) => raw.id);

  if (staleIds.length > 0) {
    await knex.transaction(async (trx) => {
      for (const id of staleIds) {
        const locked = await trx("cart_items")
          .where({ id })
          .forUpdate()
          .first();
        if (locked && locked.quantity > 1) {
          await trx("cart_items")
            .where({ id })
            .update({ quantity: 1, updated_at: trx.fn.now() });
        }
      }
    });
  }

  calculated.items = calculated.items.map((item) => {
    const rawMatch = rawItems.find((r) => r.product_id === item.product_id);
    const wasReset = !item.is_available && rawMatch.quantity > 1;
    return {
      id: rawMatch.id,
      is_selected: rawMatch.is_selected,
      ...item,
      quantity: wasReset ? 1 : item.quantity,
      // base_price phải tính lại theo qty mới (1), không phải qty cũ.
      ...(wasReset && item.unit_price !== undefined
        ? { base_price: item.unit_price }
        : {}),
    };
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
    knex,
    user_id,
    { throwOnUnavailable: false },
  );
};

// Thay đổi trạng thái chọn sản phẩm — FIX: thêm ownership check
exports.toggleSelectItem = async (item_id, user_id, is_selected) => {
  await assertCartItemOwnership(item_id, user_id);
  return knex("cart_items").where({ id: item_id }).update({ is_selected });
};

// Cập nhật số lượng — FIX: thêm ownership check
exports.updateItem = async (item_id, user_id, quantity) => {
  return knex.transaction(async (trx) => {
    // Ownership check kết hợp lấy cart item
    const cartItem = await assertCartItemOwnership(item_id, user_id, trx);

    if (quantity <= 0) {
      const err = new Error("Số lượng phải lớn hơn 0");
      err.statusCode = 400;
      throw err;
    }

    const inventory = await trx("inventory")
      .where({ product_id: cartItem.product_id })
      .first();

    if (
      !inventory ||
      inventory.status !== "active" ||
      inventory.quantity <= 0
    ) {
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

// Xóa sản phẩm khỏi giỏ — FIX: thêm ownership check
exports.removeItem = async (item_id, user_id) => {
  if (!item_id) throw new Error("Item ID required");
  // Verify ownership trước khi xóa
  await assertCartItemOwnership(item_id, user_id);
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
