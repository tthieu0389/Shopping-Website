const service = require("../services/orderitem.service");
const knex = require("../database/knex");

// GET ITEMS BY ORDER ID (ONLY)
exports.getByOrderId = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({
        message: "Invalid orderId",
      });
    }

    // check order exists + ownership
    const order = await knex("orders").where({ id: orderId }).first();

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const items = await service.getOrderItemsByOrderId(orderId);

    res.json({
      data: items,
    });
  } catch (err) {
    next(err);
  }
};
