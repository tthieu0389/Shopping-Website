const express = require("express");
const router = express.Router();

const inventoryController = require("../controller/inventory.controller");
const checkRole = require("../middlewares/checkRole");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");
const pagination = require("../middlewares/pagination");

const {
  createInventorySchema,
  updateInventorySchema,
} = require("../schema/inventory.schema");

//GET ALL INVENTORY
router.get("/", pagination(), inventoryController.getAllInventory);

//GET LOW STOCK ITEMS
router.get(
  "/low-stock",
  verifyToken(),
  checkRole("admin"),
  inventoryController.getLowStockItems,
);

//GET INVENTORY BY PRODUCT ID
router.get(
  "/product/:product_id",
  verifyToken(),
  checkRole("admin"),
  inventoryController.getInventoryByProductId,
);

//CREATE INVENTORY
router.post(
  "/",
  verifyToken(),
  checkRole("admin"),
  validate(createInventorySchema),
  inventoryController.createInventory,
);

//UPDATE INVENTORY
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updateInventorySchema),
  inventoryController.updateInventory,
);

//SOFT DELETE INVENTORY (ARCHIVE)
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  inventoryController.deleteInventory,
);

module.exports = router;
