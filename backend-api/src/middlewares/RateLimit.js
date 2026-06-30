const rateLimit = require("express-rate-limit");

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true, // Trả về thông tin rate limit qua header RateLimit-*
    legacyHeaders: false, // Tắt header X-RateLimit-* cũ
    handler: (req, res, _next, opts) => {
      res.status(429).json({
        success: false,
        error: opts.message || "Quá nhiều request. Vui lòng thử lại sau.",
      });
    },
    ...options,
  });

// login / register
const loginLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Quá nhiều lần đăng nhập. Vui lòng thử lại sau.",
});

// order / checkout
const orderLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 3,
  message: "Bạn thao tác đặt đơn quá nhanh.",
});

// order items
const orderItemLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 5,
  message: "Thao tác món trong đơn quá nhanh.",
});

// inventory
const inventoryLimiter = createLimiter({
  windowMs: 30 * 1000,
  max: 10,
  message: "Bạn thao tác kho quá nhanh.",
});

// user admin
const userLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Bạn thao tác user quá nhiều.",
});

// cart
const cartLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 20,
  message: "Bạn cập nhật giỏ hàng quá nhanh.",
});

// blog
const blogLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 15,
  message: "Bạn thao tác blog quá nhanh.",
});

// review
const reviewLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: "Bạn đã gửi quá nhiều đánh giá.",
});

// favorite
const favoriteLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 10,
  message: "Bạn thao tác quá nhanh.",
});

// contact
const contactLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 2,
  message: "Bạn đã gửi quá nhiều yêu cầu liên hệ.",
});

// promotion
const promotionLimiter = createLimiter({
  windowMs: 30 * 1000,
  max: 10,
  message: "Bạn thao tác khuyến mãi quá nhanh.",
});

// product
const productLimiter = createLimiter({
  windowMs: 3 * 1000,
  max: 50,
  message: "Quá nhiều request sản phẩm.",
});

// category
const categoryLimiter = createLimiter({
  windowMs: 3 * 1000,
  max: 50,
  message: "Quá nhiều request danh mục.",
});

// store (danh sách cửa hàng, ít thay đổi)
const storeLimiter = createLimiter({
  windowMs: 3 * 1000,
  max: 10,
  message: "Bạn thao tác cửa hàng quá nhanh.",
});

// blog-images (ảnh blog)
const blogImageLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 15,
  message: "Bạn thao tác ảnh blog quá nhanh.",
});

// inventory-logs
const inventoryLogLimiter = createLimiter({
  windowMs: 3 * 1000,
  max: 10,
  message: "Bạn truy vấn lịch sử kho quá nhanh.",
});

// user-address / user-payment / user-profile (thao tác tài khoản cá nhân)
const userAddressLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 10,
  message: "Bạn thao tác địa chỉ quá nhanh.",
});

const userPaymentLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 10,
  message: "Bạn thao tác phương thức thanh toán quá nhanh.",
});

const userProfileLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 10,
  message: "Bạn thao tác hồ sơ quá nhanh.",
});

// api-docs (chặn bot crawl/scan swagger)
const docsLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Quá nhiều request tới tài liệu API.",
});

module.exports = {
  loginLimiter,
  orderLimiter,
  orderItemLimiter,
  inventoryLimiter,
  userLimiter,
  cartLimiter,
  blogLimiter,
  reviewLimiter,
  favoriteLimiter,
  contactLimiter,
  promotionLimiter,
  productLimiter,
  categoryLimiter,
  storeLimiter,
  blogImageLimiter,
  inventoryLogLimiter,
  userAddressLimiter,
  userPaymentLimiter,
  userProfileLimiter,
  docsLimiter,
};
