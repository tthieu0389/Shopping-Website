const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const productImageController = require("../controller/productsimage.controller");

const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");

const { uploadProductImagesSchema } = require("../schema/productsimage.schema");

// Upload nhiều ảnh
router.post(
  "/upload",
  verifyToken,
  checkRole("admin"),
  upload.array("images", 10), // tối đa 10 ảnh
  validate(uploadProductImagesSchema),
  productImageController.uploadImages,
);

// Lấy ảnh theo product
router.get("/product/:productId", productImageController.getByProductId);

// Xóa 1 ảnh
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  productImageController.deleteImage,
);

module.exports = router;
