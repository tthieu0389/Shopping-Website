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
const loginLimiter = createLimiter({ windowMs: 60 * 1000, max: 20 }); // 1 phút 20 lần
const userLimiter = createLimiter({ windowMs: 60 * 1000, max: 20 });
const contactLimiter = createLimiter({ windowMs: 60 * 1000, max: 10 });
const reviewLimiter = createLimiter({ windowMs: 60 * 1000, max: 10 });

// Nhóm thao tác người dùng (Nới lỏng tối đa)
const orderLimiter = createLimiter({ windowMs: 1000, max: 10 });
const orderItemLimiter = createLimiter({ windowMs: 1000, max: 10 });
const cartLimiter = createLimiter({ windowMs: 1000, max: 50 });
const userAddressLimiter = createLimiter({ windowMs: 1000, max: 20 });
const userPaymentLimiter = createLimiter({ windowMs: 1000, max: 20 });
const userProfileLimiter = createLimiter({ windowMs: 1000, max: 20 });
const favoriteLimiter = createLimiter({ windowMs: 1000, max: 20 });

// Nhóm dữ liệu công khai (Sản phẩm, danh mục, blog -> Nới lỏng hoàn toàn)
const productLimiter = createLimiter({ windowMs: 1000, max: 100 });
const categoryLimiter = createLimiter({ windowMs: 1000, max: 100 });
const storeLimiter = createLimiter({ windowMs: 1000, max: 50 });
const blogLimiter = createLimiter({ windowMs: 1000, max: 50 });
const blogImageLimiter = createLimiter({ windowMs: 1000, max: 50 });

// Nhóm hệ thống / quản trị nội bộ
const inventoryLimiter = createLimiter({ windowMs: 2000, max: 50 });
const inventoryLogLimiter = createLimiter({ windowMs: 1000, max: 50 });
const promotionLimiter = createLimiter({ windowMs: 2000, max: 50 });
const docsLimiter = createLimiter({ windowMs: 1000, max: 100 });

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
