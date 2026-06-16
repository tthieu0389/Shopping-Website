const rateLimit = require("express-rate-limit");

// login / register
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Quá nhiều lần đăng nhập. Vui lòng thử lại sau.",
});

// order / checkout
const orderLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 giây
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn thao tác đặt đơn quá nhanh.",
});

// order items
const orderItemLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 giây
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Thao tác món trong đơn quá nhanh.",
});

// inventory (admin)
const inventoryLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 giây
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn thao tác kho quá nhanh.",
});

// user admin
const userLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn thao tác user quá nhiều.",
});

// cart
const cartLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 giây
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn cập nhật giỏ hàng quá nhanh.",
});

// blog
const blogLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 giây
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn thao tác blog quá nhanh.",
});

// review
const reviewLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn đã gửi quá nhiều đánh giá.",
});

// favorite
const favoriteLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 giây
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn thao tác quá nhanh.",
});

// contact
const contactLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn đã gửi quá nhiều yêu cầu liên hệ.",
});

// promotion
const promotionLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 giây
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn thao tác khuyến mãi quá nhanh.",
});

// product (public)
const productLimiter = rateLimit({
  windowMs: 3 * 1000, // 3 giây (nhanh nhất)
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Quá nhiều request sản phẩm.",
});

// menu / general
const menuLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 giây
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn thao tác thực đơn quá nhanh.",
});

// default fallback
const defaultLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 giây
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Quá nhiều request. Vui lòng thử lại sau.",
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
  menuLimiter,
  defaultLimiter,
};
