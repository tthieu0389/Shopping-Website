const knex = require("../database/knex");

// recalc total
const recalculateOrderTotal = async (trx, orderId) => {
  const items = await trx("order_items").where("order_id", orderId);

  const total = items.reduce((sum, item) => {
    return sum + Number(item.price);
  }, 0);

  await trx("orders").where("id", orderId).update({ total_amount: total });

  return total;
};

// GET ITEMS
exports.getOrderItemsByOrderId = async (orderId) => {
  return knex("order_items")
    .join("products", "order_items.product_id", "products.id")
    .where("order_items.order_id", orderId)
    .select(
      "order_items.id",
      "order_items.order_id",
      "order_items.product_id",
      "order_items.quantity",
      "order_items.price",
      "products.name as product_name",
    );
};

// INTERNAL ONLY
exports.createOrderItem = async (trx, data) => {
  const product = await trx("products").where("id", data.product_id).first();

  if (!product) throw new Error("Product not found");

  const price = Number(product.price) * data.quantity;

  const [item] = await trx("order_items")
    .insert({
      order_id: data.order_id,
      product_id: data.product_id,
      quantity: data.quantity,
      price,
    })
    .returning("*");

  await recalculateOrderTotal(trx, data.order_id);

  return item;
};

// INTERNAL ONLY
exports.deleteOrderItem = async (trx, id) => {
  const item = await trx("order_items").where("id", id).first();
  if (!item) return false;

  await trx("order_items").where("id", id).del();

  await recalculateOrderTotal(trx, item.order_id);

  return true;
};
