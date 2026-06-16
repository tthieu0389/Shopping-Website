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

// Danh sách nhãn tiếng Việt
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

// Lấy tất cả sản phẩm
router.get("/", pagination(), productController.getAllProducts);

// Lấy sản phẩm theo ID
router.get("/:id", productController.getProductById);

// Tạo sản phẩm mới
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  validate(createProductSchema, {
    fieldLabels: productFieldLabels,
  }),
  productController.createProduct,
);

// Cập nhật sản phẩm
router.put(
  "/:id",
  verifyToken,
  checkRole("admin"),
  validate(updateProductSchema, {
    fieldLabels: productFieldLabels,
  }),
  productController.updateProduct,
);

// Xóa sản phẩm (soft delete)
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  productController.deleteProduct,
);

module.exports = router;
