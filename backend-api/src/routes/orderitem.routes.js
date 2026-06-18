const express = require("express");
const router = express.Router();

const orderItemController = require("../controller/orderitem.controller");
const verifyToken = require("../middlewares/verifyToken");

// GET items by order id (with ownership check inside controller)
router.get("/order/:orderId", verifyToken(), orderItemController.getByOrderId);

module.exports = router;
