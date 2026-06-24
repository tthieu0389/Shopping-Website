const orderService = require("../services/order.service");

// PREVIEW ORDER
exports.previewOrder = async (req, res, next) => {
  try {
    const result = await orderService.previewOrder(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// CREATE ORDER
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const order = await orderService.createOrder(userId, req.body);

    res.status(201).json({
      message: "Order created",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// GET ALL ORDERS
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    const filters = {
      status: req.query.status,
      date: req.query.date,
    };

    const result =
      req.user.role === "admin"
        ? await orderService.getAllOrders({ limit, offset, filters })
        : await orderService.getOrdersByUser({
            userId: req.user.id,
            limit,
            offset,
            filters,
          });

    res.json({
      data: result.data,
      total: result.total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE ORDER (ONLY STATUS + NOTE)
exports.updateOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    if (req.body.status === "cancelled") {
      return res.status(400).json({
        message: "Use cancel endpoint to cancel order",
      });
    }

    // Service da tu dong throw loi 404 neu khong tim thay order
    const order = await orderService.updateOrder(orderId, {
      status: req.body.status,
      note: req.body.note,
    });

    res.json({
      message: "Order updated successfully",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// CANCEL ORDER
exports.cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const result = await orderService.cancelOrder(orderId);

    res.json({
      message: "Order cancelled successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE ORDER (ADMIN ONLY)
exports.deleteOrder = async (req, res, next) => {
  try {
    await orderService.deleteOrder(req.params.id);

    res.json({
      message: "Order deleted",
    });
  } catch (err) {
    next(err);
  }
};

// GET ORDER BY ID
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
