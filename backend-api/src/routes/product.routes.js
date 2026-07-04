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
  product_type: "Loại sản phẩm",
  category_id: "Danh mục",
  brand: "Thương hiệu",
  model: "Mã thiết bị",
  attributes: "Thông số kỹ thuật",
  is_available: "Trạng thái hiển thị",
  is_featured: "Sản phẩm nổi bật",
};

// Lấy danh sách toàn bộ sản phẩm (public)
router.get("/", pagination(), productController.getAllProducts);

// Danh sách sản phẩm cho admin/staff (thấy cả inactive/archived) 
// phải đặt trước "/:idOrSlug" để tránh bị route đó "nuốt" mất do cùng 1 segment.
router.get(
  "/admin/list",
  verifyToken(),
  checkRole("admin", "staff"),
  pagination(),
  productController.getAllProductsForAdmin,
);

// Lấy sản phẩm liên quan (xếp trên vì có hậu tố rõ ràng '/related')
router.get("/:id/related", productController.getRelatedProducts);

// Lấy chi tiết sản phẩm theo ID hoặc Slug (PHẢI XẾP DƯỚI CÙNG trong nhóm GET)
router.get("/:idOrSlug", productController.getProductByIdOrSlug);

// Tạo mới sản phẩm (Admin/Staff)
router.post(
  "/",
  verifyToken(),
  checkRole("admin", "staff"),
  validate(createProductSchema, {
    fieldLabels: productFieldLabels,
  }),
  productController.createProduct,
);

// Cập nhật thông tin sản phẩm (Admin/Staff)
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin", "staff"),
  validate(updateProductSchema, {
    fieldLabels: productFieldLabels,
  }),
  productController.updateProduct,
);

// Xóa sản phẩm (Admin)
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  productController.deleteProduct,
);

module.exports = router;
