const express = require("express");
const router = express.Router();

const orderController = require("../controller/order.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const pagination = require("../middlewares/pagination");

const {
  createOrderSchema,
  updateOrderSchema,
  previewOrderSchema,
} = require("../schema/order.schema");

// PREVIEW ORDER
router.post(
  "/preview",
  verifyToken(),
  validate(previewOrderSchema),
  orderController.previewOrder,
);

// CREATE ORDER
router.post(
  "/",
  verifyToken(),
  validate(createOrderSchema),
  orderController.createOrder,
);

// GET ALL ORDERS (ADMIN + USER)
router.get("/", verifyToken(), pagination(), orderController.getAllOrders);

// GET ORDER BY ID
router.get("/:id", verifyToken(), orderController.getOrderById);

// UPDATE ORDER
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updateOrderSchema),
  orderController.updateOrder,
);

// CANCEL ORDER (Khách hàng hoặc Admin tự hủy đơn)
router.post("/:id/cancel", verifyToken(), orderController.cancelOrder);

// DELETE ORDER
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  orderController.deleteOrder,
);

module.exports = router;
