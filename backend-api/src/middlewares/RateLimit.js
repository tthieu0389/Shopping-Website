const rateLimit = require("express-rate-limit");

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, opts) => {
      res.status(429).json({
        success: false,
        error:
          opts.message || "Thao tác quá nhanh, vui lòng chậm lại một chút.",
      });
    },
    ...options,
  });

// Nhóm thao tác quan trọng (Giữ lại độ trễ nhỏ để tránh brute force)
const loginLimiter = createLimiter({ windowMs: 60 * 1000, max: 60 }); // 1 phút 60 lần
const authLoginLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 10, // tối đa 10 lần thử /5 phút / IP
  message: "Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau 5 phút.",
});
const userLimiter = createLimiter({ windowMs: 60 * 1000, max: 60 }); // 1 phút 60 lần
const contactLimiter = createLimiter({ windowMs: 60 * 1000, max: 30 }); // 1 phút 30 lần
const reviewLimiter = createLimiter({ windowMs: 60 * 1000, max: 30 }); // 1 phút 30 lần

// Nhóm thao tác người dùng (Nới lỏng tối đa)
const orderLimiter = createLimiter({ windowMs: 10 * 1000, max: 50 }); // 10 giây 50 lần
const orderItemLimiter = createLimiter({ windowMs: 10 * 1000, max: 50 }); // 10 giây 50 lần
const cartLimiter = createLimiter({ windowMs: 10 * 1000, max: 200 }); // 10 giây 200 lần
const userAddressLimiter = createLimiter({ windowMs: 10 * 1000, max: 100 }); // 10 giây 100 lần
const userPaymentLimiter = createLimiter({ windowMs: 10 * 1000, max: 100 }); // 10 giây 100 lần
const userProfileLimiter = createLimiter({ windowMs: 10 * 1000, max: 100 }); // 10 giây 100 lần
const favoriteLimiter = createLimiter({ windowMs: 10 * 1000, max: 100 }); // 10 giây 100 lần

// Nhóm dữ liệu công khai (Sản phẩm, danh mục, blog -> Nới lỏng hoàn toàn)
const productLimiter = createLimiter({ windowMs: 10 * 1000, max: 1000 }); // 10 giây 1000 lần
const categoryLimiter = createLimiter({ windowMs: 10 * 1000, max: 1000 }); // 10 giây 1000 lần
const storeLimiter = createLimiter({ windowMs: 10 * 1000, max: 500 }); // 10 giây 500 lần
const blogLimiter = createLimiter({ windowMs: 10 * 1000, max: 500 }); // 10 giây 500 lần
const blogImageLimiter = createLimiter({ windowMs: 10 * 1000, max: 500 }); // 10 giây 500 lần

// Nhóm hệ thống / quản trị nội bộ
const inventoryLimiter = createLimiter({ windowMs: 10 * 1000, max: 200 }); // 10 giây 200 lần
const inventoryLogLimiter = createLimiter({ windowMs: 10 * 1000, max: 200 }); // 10 giây 200 lần
const promotionLimiter = createLimiter({ windowMs: 10 * 1000, max: 200 }); // 10 giây 200 lần
const docsLimiter = createLimiter({ windowMs: 10 * 1000, max: 500 }); // 10 giây 500 lần

module.exports = {
  loginLimiter,
  authLoginLimiter,
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
