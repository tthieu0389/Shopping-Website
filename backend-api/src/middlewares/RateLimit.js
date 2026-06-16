const rateLimit = require("express-rate-limit");

const createLimiter = (options) =>
  rateLimit({
    ...options,
    skip: () => process.env.NODE_ENV === "test", // <<< QUAN TRỌNG: tắt rate limit khi test
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

// menu
const menuLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 40,
  message: "Bạn thao tác thực đơn quá nhanh.",
});

// default
const defaultLimiter = createLimiter({
  windowMs: 5 * 1000,
  max: 30,
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
