const orderItemService = require("../services/orderitem.service");
const orderService = require("../services/order.service");

// GET ITEMS BY ORDER ID (ONLY)
exports.getByOrderId = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({
        message: "Invalid orderId",
      });
    }

    // Dùng orderService.getOrderById thay vì query knex trực tiếp
    const order = await orderService.getOrderById(orderId);

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

    const items = await orderItemService.getOrderItemsByOrderId(orderId);

    res.json({
      data: items,
    });
  } catch (err) {
    next(err);
  }
};
