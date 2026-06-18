const knex = require("../database/knex");
const orderItemService = require("./orderitem.service");
const promotionService = require("./promotion.service");
const inventoryService = require("./inventory.service");

// CREATE ORDER
exports.createOrder = async (userId, data) => {
  return knex.transaction(async (trx) => {
    // Validate input
    if (!data.items || data.items.length === 0) {
      const err = new Error("Cart cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    if (!data.address_id && !data.pickup_store_id) {
      const err = new Error("Address or pickup store is required");
      err.statusCode = 400;
      throw err;
    }

    // Create order
    const [order] = await trx("orders")
      .insert({
        order_code: `ORD-${Date.now()}-${userId}`,
        user_id: userId,
        address_id: data.address_id || null,
        pickup_store_id: data.pickup_store_id || null,
        payment_method: data.payment_method || "cod",
        note: data.note || null,
        status: "pending",
        total_amount: 0,
      })
      .returning("*");

    let totalAmount = 0;

    // Process items
    for (const item of data.items) {
      if (!item.product_id || !item.quantity) {
        const err = new Error("Invalid item");
        err.statusCode = 400;
        throw err;
      }

      // Check product
      const product = await trx("products")
        .where({ id: item.product_id, is_deleted: false })
        .first();

      if (!product) {
        const err = new Error(`Product ${item.product_id} not found`);
        err.statusCode = 404;
        throw err;
      }

      // DECREASE STOCK VIA INVENTORY SERVICE
      await inventoryService.decreaseStock(
        trx,
        item.product_id,
        item.quantity,
        order.id,
      );

      // Promotions
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

      totalAmount += finalPrice;

      // Order items
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

    // Update total
    await trx("orders")
      .where({ id: order.id })
      .update({ total_amount: totalAmount });

    return {
      ...order,
      total_amount: totalAmount,
    };
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

    if (!["pending", "confirmed"].includes(order.status)) {
      const err = new Error(
        "Only pending or confirmed orders can be cancelled",
      );
      err.statusCode = 400;
      throw err;
    }

    if (order.status === "cancelled") {
      const err = new Error("Order already cancelled");
      err.statusCode = 400;
      throw err;
    }

    const items = await trx("order_items").where("order_id", orderId);

    for (const item of items) {
      // RETURN STOCK VIA INVENTORY SERVICE
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

// GET ALL ORDERS
exports.getAllOrders = async ({ limit = 10, offset = 0, filters = {} }) => {
  let query = knex("orders");
  let countQuery = knex("orders");

  if (filters.status) {
    query.where("status", filters.status);
    countQuery.where("status", filters.status);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setDate(end.getDate() + 1);

    query.whereBetween("created_at", [start, end]);
    countQuery.whereBetween("created_at", [start, end]);
  }

  const totalRow = await countQuery.count("* as count").first();

  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return {
    data,
    total: Number(totalRow.count),
  };
};

// GET ORDERS BY USER
exports.getOrdersByUser = async ({
  userId,
  limit = 10,
  offset = 0,
  filters = {},
}) => {
  let query = knex("orders").where("user_id", userId);
  let countQuery = knex("orders").where("user_id", userId);

  if (filters.status) {
    query.where("status", filters.status);
    countQuery.where("status", filters.status);
  }

  const totalRow = await countQuery.count("* as count").first();

  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return {
    data,
    total: Number(totalRow.count),
  };
};

// UPDATE ORDER
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
    if (data[field] !== undefined) {
      cleanData[field] = data[field];
    }
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

// DELETE ORDER
exports.deleteOrder = async (id) => {
  if (!id || isNaN(id)) return null;

  return knex("orders").where("id", id).del();
};

// GET ORDER BY ID
exports.getOrderById = async (orderId) => {
  if (!orderId || isNaN(orderId)) return null;

  const order = await knex("orders").where("id", orderId).first();

  if (!order) return null;

  const items = await orderItemService.getOrderItemsByOrderId(orderId);

  return {
    ...order,
    items,
  };
};
