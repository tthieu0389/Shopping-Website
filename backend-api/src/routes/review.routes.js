const express = require("express");
const router = express.Router();

const reviewController = require("../controller/review.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");
const checkRole = require("../middlewares/checkRole");

const { createReviewSchema } = require("../schema/review.schema");

// Get featured reviews (trang chủ) - đặt trước "/" và "/product/:productId" cho rõ ràng
router.get("/featured", reviewController.getFeatured);

// Get all reviews (ADMIN) - phân trang + tìm theo tên khách hàng/sản phẩm/nội dung
router.get(
  "/admin",
  verifyToken(),
  checkRole("admin"),
  reviewController.getAllForAdmin,
);

// Get reviews by query
// optional: true - route vẫn public (không bắt buộc đăng nhập)
// nhưng nếu có token hợp lệ thì req.user sẽ được gắn để review của bản thân được pin lên đầu
router.get("/", verifyToken({ optional: true }), reviewController.getByProduct);

// Get reviews by param
router.get(
  "/product/:productId",
  verifyToken({ optional: true }),
  reviewController.getByProduct,
);

// Create review
router.post(
  "/",
  verifyToken(),
  validate(createReviewSchema),
  reviewController.create,
);

// Delete review
router.delete("/:id", verifyToken(), reviewController.remove);

module.exports = router;
