const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

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

// auth
app.use("/api/auth", loginLimiter, authRoutes);

// blog
app.use("/api/blogs", blogLimiter, blogRoutes);

// cart
app.use("/api/cart", cartLimiter, cartRoutes);

// category
app.use("/api/categories", categoryRoutes);

// contact
app.use("/api/contacts", contactLimiter, contactRoutes);

// favorite
app.use("/api/favorites", favoriteLimiter, favoriteRoutes);

// inventory
app.use("/api/inventory", inventoryLimiter, inventoryRoutes);
app.use("/api/inventory-logs", inventoryLogRoutes);

// order
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/order-items", orderItemLimiter, orderItemRoutes);

// promotion
app.use("/api/promotions", promotionLimiter, promotionRoutes);
app.use("/api/product-promotions", promotionLimiter, productPromotionRoutes);

// product
app.use("/api/products", productLimiter, productRoutes);
app.use("/api/product-details", productLimiter, productDetailRoutes);
app.use("/api/product-images", productLimiter, productImageRoutes);

// review
app.use("/api/reviews", reviewLimiter, reviewRoutes);

// store
app.use("/api/stores", storeRoutes);

// user
app.use("/api/users", userLimiter, userRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy route API." });
});

// error handler
app.use(errorHandler);

module.exports = app;
