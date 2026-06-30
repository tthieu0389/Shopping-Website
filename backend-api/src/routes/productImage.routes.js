const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const productImageController = require("../controller/productsimage.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const { createProductImageSchema } = require("../schema/productsimage.schema");

// UPLOAD IMAGES
router.post(
  "/upload",
  verifyToken(),
  checkRole("admin"),
  upload("products").array("images", 10),
  validate(createProductImageSchema),
  productImageController.uploadImages,
);

// GET IMAGES BY PRODUCT
router.get("/product/:productId", productImageController.getByProductId);

// DELETE IMAGE
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  productImageController.deleteImage,
);

// SET THUMBNAIL
router.patch(
  "/:id/thumbnail",
  verifyToken(),
  checkRole("admin"),
  productImageController.setThumbnail,
);

module.exports = router;
