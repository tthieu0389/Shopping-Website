const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// swagger
const swaggerRoutes = require("./routes/swagger");
app.use("/api-docs", swaggerRoutes);

// routes
const authRoutes = require("./routes/auth.routes");
const blogRoutes = require("./routes/blog.routes");
const cartRoutes = require("./routes/cart.routes");
const categoryRoutes = require("./routes/category.routes");
const contactRoutes = require("./routes/contact.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const inventoryLogRoutes = require("./routes/inventoryLog.routes");
const orderRoutes = require("./routes/order.routes");
const orderItemRoutes = require("./routes/orderitem.routes");
const promotionRoutes = require("./routes/promotion.routes");
const productPromotionRoutes = require("./routes/productPromotion.routes");
const productRoutes = require("./routes/product.routes");
const productDetailRoutes = require("./routes/productDetail.routes");
const productImageRoutes = require("./routes/productImage.routes");
const reviewRoutes = require("./routes/review.routes");
const storeRoutes = require("./routes/store.routes");
const userRoutes = require("./routes/user.routes");
const userAddressRoutes = require("./routes/useraddress.routes");
const userPaymentRoutes = require("./routes/userpayment.routes");
const userProfileRoutes = require("./routes/userprofile.routes");

// Only apply rate limiters outside of test environment
const isTest = process.env.NODE_ENV === "test";

const {
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
} = require("./middlewares/RateLimit");

const noOp = (_req, _res, next) => next(); // pass-through for test env

// auth
app.use("/api/auth", isTest ? noOp : loginLimiter, authRoutes);
// blog
app.use("/api/blogs", isTest ? noOp : blogLimiter, blogRoutes);
// cart
app.use("/api/cart", isTest ? noOp : cartLimiter, cartRoutes);
// category
app.use("/api/categories", categoryRoutes);
// contact
app.use("/api/contacts", isTest ? noOp : contactLimiter, contactRoutes);
// favorite
app.use("/api/favorites", isTest ? noOp : favoriteLimiter, favoriteRoutes);
// inventory
app.use("/api/inventory", isTest ? noOp : inventoryLimiter, inventoryRoutes);
app.use("/api/inventory-logs", inventoryLogRoutes);
// order
app.use("/api/orders", isTest ? noOp : orderLimiter, orderRoutes);
app.use("/api/order-items", isTest ? noOp : orderItemLimiter, orderItemRoutes);
// promotion
app.use("/api/promotions", isTest ? noOp : promotionLimiter, promotionRoutes);
app.use(
  "/api/product-promotions",
  isTest ? noOp : promotionLimiter,
  productPromotionRoutes,
);
// product
app.use("/api/products", isTest ? noOp : productLimiter, productRoutes);
app.use(
  "/api/product-details",
  isTest ? noOp : productLimiter,
  productDetailRoutes,
);
app.use(
  "/api/product-images",
  isTest ? noOp : productLimiter,
  productImageRoutes,
);
// review
app.use("/api/reviews", isTest ? noOp : reviewLimiter, reviewRoutes);
// store
app.use("/api/stores", storeRoutes);
// user
app.use("/api/users", isTest ? noOp : userLimiter, userRoutes);
app.use("/api/user-addresses", userAddressRoutes);
app.use("/api/user-payments", userPaymentRoutes);
app.use("/api/user-profiles", userProfileRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy route API." });
});
// error handler
app.use(errorHandler);

module.exports = app;
