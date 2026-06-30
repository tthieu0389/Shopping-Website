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

router.get("/product/:productId", productDetailController.getByProductId);

router.post(
  "/",
  verifyToken(),
  checkRole("admin", "staff"),
  validate(createProductDetailSchema),
  productDetailController.create,
);

router.put(
  "/:id",
  verifyToken(),
  checkRole("admin", "staff"),
  validate(updateProductDetailSchema),
  productDetailController.update,
);

router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  productDetailController.delete,
);

module.exports = router;
