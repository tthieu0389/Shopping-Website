const knex = require("../database/knex");

// GET OR CREATE CART
const getOrCreateCart = async (user_id, trx = knex) => {
  let cart = await trx("carts").where({ user_id }).first();

  if (!cart) {
    [cart] = await trx("carts").insert({ user_id }).returning("*");
  }

  return cart;
};

// ADD TO CART
exports.addToCart = async (user_id, product_id, quantity) => {
  return knex.transaction(async (trx) => {
    const product = await trx("products")
      .where({ id: product_id, is_deleted: false })
      .first();

    if (!product) throw new Error("Product not found");

    const inventory = await trx("inventory").where({ product_id }).first();

    if (!inventory || inventory.quantity < quantity) {
      throw new Error("Not enough stock");
    }

    const cart = await getOrCreateCart(user_id, trx);

    const existing = await trx("cart_items")
      .where({ cart_id: cart.id, product_id })
      .first();

    if (existing) {
      const newQty = existing.quantity + quantity;

      if (inventory.quantity < newQty) {
        throw new Error("Not enough stock (cart total)");
      }

      return trx("cart_items")
        .where({ id: existing.id })
        .update({ quantity: newQty, updated_at: trx.fn.now() })
        .returning("*")
        .then(([r]) => r);
    }

    const [item] = await trx("cart_items")
      .insert({
        cart_id: cart.id,
        product_id,
        quantity,
      })
      .returning("*");

    return item;
  });
};

// GET CART ITEMS
exports.getCartItems = async (user_id) => {
  const cart = await getOrCreateCart(user_id);

  return knex("cart_items as ci")
    .join("products as p", "ci.product_id", "p.id")
    .select(
      "ci.id",
      "ci.product_id",
      "p.name",
      "p.price",
      "ci.quantity",
      knex.raw("ci.quantity * p.price as subtotal"),
    )
    .where("ci.cart_id", cart.id);
};

// UPDATE ITEM
exports.updateItem = async (item_id, quantity) => {
  return knex.transaction(async (trx) => {
    const item = await trx("cart_items").where({ id: item_id }).first();
    if (!item) throw new Error("Cart item not found");

    const inventory = await trx("inventory")
      .where({ product_id: item.product_id })
      .first();

    if (!inventory || inventory.quantity < quantity) {
      throw new Error("Not enough stock");
    }

    const [updated] = await trx("cart_items")
      .where({ id: item_id })
      .update({ quantity, updated_at: trx.fn.now() })
      .returning("*");

    return updated;
  });
};

// REMOVE ITEM
exports.removeItem = async (item_id) => {
  return knex("cart_items").where({ id: item_id }).del();
};

// CLEAR CART
exports.clearCart = async (user_id) => {
  const cart = await knex("carts").where({ user_id }).first();
  if (!cart) return;

  return knex("cart_items").where({ cart_id: cart.id }).del();
};

exports.checkout = async (user_id, data) => {
  return knex.transaction(async (trx) => {
    const cart = await trx("carts").where({ user_id }).first();

    if (!cart) throw new Error("Cart not found");

    const items = await trx("cart_items").where({ cart_id: cart.id });

    if (items.length === 0) throw new Error("Cart is empty");

    const [order] = await trx("orders")
      .insert({
        user_id,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,
        payment_method: data.payment_method,
        note: data.note || null,
        status: "pending",
        total_amount: 0,
      })
      .returning("*");

    let total = 0;

    for (const item of items) {
      const product = await trx("products")
        .where({ id: item.product_id, is_deleted: false })
        .first();

      if (!product) throw new Error("Product not found");

      // ATOMIC STOCK UPDATE (FIX RACE CONDITION)
      const updated = await trx("inventory")
        .where({
          product_id: item.product_id,
        })
        .andWhere("quantity", ">=", item.quantity)
        .decrement("quantity", item.quantity)
        .returning("*");

      if (!updated.length) {
        throw new Error(`Not enough stock for product ${item.product_id}`);
      }

      const price = Number(product.price) * item.quantity;
      total += price;

      await trx("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity,
        price,
        discount_amount: 0,
      });
    }

    await trx("orders").where({ id: order.id }).update({ total_amount: total });

    await trx("cart_items").where({ cart_id: cart.id }).del();

    return { ...order, total_amount: total };
  });
};
