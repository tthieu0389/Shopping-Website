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
    const isStaffActing =
      ["admin", "staff"].includes(req.user.role) && req.body.user_id;

    // User thuong: tu tao don cho chinh minh, khong duoc set user_id cua nguoi khac
    // Staff/admin: co the truyen user_id de "len don ho" cho khach
    const targetUserId = isStaffActing ? req.body.user_id : req.user.id;
    const createdByStaffId = isStaffActing ? req.user.id : null;

    const order = await orderService.createOrder(
      targetUserId,
      req.body,
      createdByStaffId,
    );

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

    let result;
    if (req.user.role === "admin") {
      // Admin xem tat ca don hang
      result = await orderService.getAllOrders({ limit, offset, filters });
    } else if (req.user.role === "staff") {
      // Staff chi xem don minh da tao ho user
      result = await orderService.getOrdersByStaff({
        staffId: req.user.id,
        limit,
        offset,
        filters,
      });
    } else {
      // User thuong chi xem don cua chinh minh
      result = await orderService.getOrdersByUser({
        userId: req.user.id,
        limit,
        offset,
        filters,
      });
    }

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

// UPDATE ORDER (ONLY STATUS + NOTE) — admin + staff duoc update
exports.updateOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    if (req.body.status === "cancelled") {
      return res.status(400).json({
        message: "Use cancel endpoint to cancel order",
      });
    }

    // Staff chi duoc update don minh tao
    if (req.user.role === "staff") {
      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.created_by_staff_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

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
    const result = await orderService.cancelOrder(
      orderId,
      req.user.id,
      req.user.role,
    );

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

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 1. ADMIN: Có toàn quyền xem tất cả đơn
    if (req.user.role === "admin") {
      return res.json({ data: order });
    }

    // 2. STAFF:
    // - Xem được đơn do chính mình tạo cho khách (order.created_by_staff_id === req.user.id)
    // - Xem được đơn mà chính mình là người mua (order.user_id === req.user.id - trường hợp staff mua hàng)
    if (req.user.role === "staff") {
      const isCreator = order.created_by_staff_id === req.user.id;
      const isOwner = order.user_id === req.user.id;

      if (!isCreator && !isOwner) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.json({ data: order });
    }

    // 3. USER:
    // - Chỉ xem được đơn của chính mình (order.user_id === req.user.id)
    if (req.user.role === "user") {
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.json({ data: order });
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (err) {
    next(err);
  }
};
