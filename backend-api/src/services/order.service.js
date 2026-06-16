const knex = require("../database/knex");
const orderItemService = require("./orderitem.service");
const promotionService = require("./promotion.service");

// CREATE ORDER
exports.createOrder = async (userId, data) => {
  return knex.transaction(async (trx) => {
    const [order] = await trx("orders")
      .insert({
        user_id: userId,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,
        payment_method: data.payment_method || "cod",
        note: data.note || null,
        status: "pending",
        total_amount: 0,
      })
      .returning("*");

    let total = 0;

    for (const item of data.items) {
      if (!item.product_id) {
        const err = new Error("product_id is required in items");
        err.statusCode = 400;
        throw err;
      }

      const product = await trx("products")
        .where({ id: item.product_id, is_deleted: false })
        .first();

      if (!product) {
        const err = new Error(`Product ${item.product_id} not found`);
        err.statusCode = 400;
        throw err;
      }

      // Inventory có thể không tồn tại
      const inventoryRows = await trx("inventory")
        .where({ product_id: item.product_id })
        .select("quantity");

      if (
        inventoryRows.length > 0 &&
        inventoryRows[0].quantity >= item.quantity
      ) {
        await trx("inventory")
          .where({ product_id: item.product_id })
          .decrement("quantity", item.quantity);
      }

      const promotions = await promotionService.getBestPromotions(
        item.product_id,
        trx,
      );

      const unitPrice = Number(product.price);
      let discountAmount = 0;

      if (promotions.length > 0) {
        discountAmount =
          promotionService.calculateTotalDiscount(unitPrice, promotions) *
          item.quantity;
      }

      const basePrice = unitPrice * item.quantity;
      const finalPrice = basePrice - discountAmount;
      total += finalPrice;

      await trx("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_price: unitPrice,
        quantity: item.quantity,
        price: basePrice,
        discount_amount: discountAmount,
      });
    }

    await trx("orders").where({ id: order.id }).update({ total_amount: total });

    return { ...order, total_amount: total };
  });
};

// CANCEL ORDER
exports.cancelOrder = async (orderId) => {
  return knex.transaction(async (trx) => {
    const order = await trx("orders").where("id", orderId).first();

    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (order.status === "cancelled") {
      const err = new Error("Order already cancelled");
      err.statusCode = 400;
      throw err;
    }

    if (order.status === "completed") {
      const err = new Error("Cannot cancel completed order");
      err.statusCode = 400;
      throw err;
    }

    const items = await trx("order_items").where("order_id", orderId);

    for (const item of items) {
      await trx("inventory")
        .where("product_id", item.product_id)
        .increment("quantity", item.quantity);
    }

    await trx("orders").where("id", orderId).update({ status: "cancelled" });

    return true;
  });
};

// GET ALL ORDERS (ADMIN)
exports.getAllOrders = async ({ limit, offset, filters = {} }) => {
  let query = knex("orders");
  let countQuery = knex("orders");

  if (filters.status) {
    query = query.where("status", filters.status);
    countQuery = countQuery.where("status", filters.status);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);
    query = query.whereBetween("created_at", [start, end]);
    countQuery = countQuery.whereBetween("created_at", [start, end]);
  }

  const totalRow = await countQuery.count("* as count").first();
  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// GET ORDERS BY USER
exports.getOrdersByUser = async ({ userId, limit, offset, filters = {} }) => {
  let query = knex("orders").where({ user_id: userId });
  let countQuery = knex("orders").where({ user_id: userId });

  if (filters.status) {
    query = query.where("status", filters.status);
    countQuery = countQuery.where("status", filters.status);
  }

  const totalRow = await countQuery.count("* as count").first();
  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(totalRow.count) };
};

// UPDATE ORDER
exports.updateOrder = async (id, data) => {
  if (!id || isNaN(id)) return null;
  const allowed = ["status", "note"];
  const clean = {};
  for (const key of allowed) {
    if (data[key] !== undefined) clean[key] = data[key];
  }
  const [order] = await knex("orders")
    .where("id", id)
    .update(clean)
    .returning("*");
  return order;
};

// DELETE ORDER
exports.deleteOrder = async (id) => {
  return knex("orders").where("id", id).del();
};

// GET ORDER BY ID
exports.getOrderById = async (orderId) => {
  if (!orderId || isNaN(orderId)) return null;
  const order = await knex("orders").where("id", orderId).first();
  if (!order) return null;
  const items = await orderItemService.getOrderItemsByOrderId(orderId);
  return { ...order, items };
};
