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
} = require("../schema/order.schema");

// PREVIEW ORDER
// Dùng chung schema validate với Create để check định dạng mảng items
router.post(
  "/preview",
  verifyToken(),
  validate(createOrderSchema),
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

// UPDATE ORDER (STATUS + NOTE ONLY)
router.put(
  "/:id",
  verifyToken(),
  validate(updateOrderSchema),
  orderController.updateOrder,
);

// CANCEL ORDER
router.post("/:id/cancel", verifyToken(), orderController.cancelOrder);

// DELETE ORDER (ADMIN ONLY)
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  orderController.deleteOrder,
);

module.exports = router;
