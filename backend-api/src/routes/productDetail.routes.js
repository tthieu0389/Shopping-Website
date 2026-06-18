const express = require("express");
const router = express.Router();

const productDetailController = require("../controller/productsdetail.controller");

const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");

const {
  createProductDetailSchema,
  updateProductDetailSchema,
} = require("../schema/productsdetail.schema");

// Lấy theo product_id
router.get("/product/:productId", productDetailController.getByProductId);

// Tạo detail
router.post(
  "/",
  verifyToken(),
  checkRole("admin"),
  validate(createProductDetailSchema),
  productDetailController.create,
);

// Update detail
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updateProductDetailSchema),
  productDetailController.update,
);

// Delete detail
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  productDetailController.delete,
);

module.exports = router;
