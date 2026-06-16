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

// CREATE ORDER
router.post(
  "/",
  verifyToken,
  validate(createOrderSchema),
  orderController.createOrder,
);

// GET ALL ORDERS (ADMIN + USER)
router.get("/", verifyToken, pagination(), orderController.getAllOrders);

// GET ORDER BY ID
router.get("/:id", verifyToken, orderController.getOrderById);

// UPDATE ORDER (STATUS + NOTE ONLY)
router.put(
  "/:id",
  verifyToken,
  validate(updateOrderSchema),
  orderController.updateOrder,
);

// CANCEL ORDER (NEW - IMPORTANT)
router.post("/:id/cancel", verifyToken, orderController.cancelOrder);

// DELETE ORDER (ADMIN ONLY)
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  orderController.deleteOrder,
);

module.exports = router;
