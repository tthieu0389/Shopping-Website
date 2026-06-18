const express = require("express");
const router = express.Router();

const productController = require("../controller/products.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const pagination = require("../middlewares/pagination");
const validate = require("../middlewares/validate");

const {
  createProductSchema,
  updateProductSchema,
} = require("../schema/products.schema");

const productFieldLabels = {
  name: "Tên sản phẩm",
  slug: "Slug",
  description: "Mô tả",
  price: "Giá bán",
  stock: "Tồn kho",
  product_type: "Loại sản phẩm",
  category_id: "Danh mục",
  is_available: "Trạng thái",
};

// Get all products
router.get("/", pagination(), productController.getAllProducts);

// Get related products (placed above to avoid route conflict)
router.get("/:id/related", productController.getRelatedProducts);

// Get product by ID or Slug
router.get("/:idOrSlug", productController.getProductByIdOrSlug);

// Create product
router.post(
  "/",
  verifyToken(),
  checkRole("admin"),
  validate(createProductSchema, {
    fieldLabels: productFieldLabels,
  }),
  productController.createProduct,
);

// Update product
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updateProductSchema, {
    fieldLabels: productFieldLabels,
  }),
  productController.updateProduct,
);

// Delete product
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  productController.deleteProduct,
);

module.exports = router;
