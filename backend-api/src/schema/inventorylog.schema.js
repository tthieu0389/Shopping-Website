const express = require("express");
const router = express.Router();

const controller = require("../controller/inventoryLog.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const pagination = require("../middlewares/pagination");
const validate = require("../middlewares/validate");

const {
  inventoryIdParamSchema,
  productIdParamSchema,
} = require("../schema/inventorylog.schema");

// GET ALL LOGS
router.get(
  "/",
  verifyToken,
  checkRole("admin"),
  pagination(),
  controller.getAllInventoryLogs,
);

// GET BY INVENTORY ID
router.get(
  "/inventory/:inventory_id",
  verifyToken,
  checkRole("admin"),
  validate(inventoryIdParamSchema, "params"),
  controller.getLogsByInventoryId,
);

// GET BY PRODUCT ID
router.get(
  "/product/:product_id",
  verifyToken,
  checkRole("admin"),
  validate(productIdParamSchema, "params"),
  controller.getLogsByProductId,
);

module.exports = router;
