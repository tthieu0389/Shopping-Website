const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// swagger
app.use("/api-docs", require("./routes/swagger"));

// auth
app.use("/api/auth", loginLimiter, require("./routes/auth.routes"));

// blog
app.use("/api/blogs", blogLimiter, require("./routes/blog.routes"));

// cart
app.use("/api/cart", cartLimiter, require("./routes/cart.routes"));

// category
app.use("/api/categories", require("./routes/category.routes"));

// contact
app.use("/api/contacts", contactLimiter, require("./routes/contact.routes"));

// favorite
app.use("/api/favorites", favoriteLimiter, require("./routes/favorite.routes"));

// inventory
app.use(
  "/api/inventory",
  inventoryLimiter,
  require("./routes/inventory.routes"),
);
app.use("/api/inventory-logs", require("./routes/inventoryLog.routes"));

// order
app.use("/api/orders", orderLimiter, require("./routes/order.routes"));
app.use(
  "/api/order-items",
  orderItemLimiter,
  require("./routes/orderitem.routes"),
);

// promotion
app.use(
  "/api/promotions",
  promotionLimiter,
  require("./routes/promotion.routes"),
);
app.use(
  "/api/product-promotions",
  promotionLimiter,
  require("./routes/productPromotion.routes"),
);

// product
app.use("/api/products", productLimiter, require("./routes/product.routes"));
app.use(
  "/api/product-details",
  productLimiter,
  require("./routes/productDetail.routes"),
);
app.use(
  "/api/product-images",
  productLimiter,
  require("./routes/productImage.routes"),
);

// review
app.use("/api/reviews", reviewLimiter, require("./routes/review.routes"));

// store
app.use("/api/stores", require("./routes/store.routes"));

// user
app.use("/api/users", userLimiter, require("./routes/user.routes"));
app.use("/api/user-addresses", require("./routes/useraddress.routes"));
app.use("/api/user-payments", require("./routes/userpayment.routes"));
app.use("/api/user-profiles", require("./routes/userprofile.routes"));

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// error handler
app.use(errorHandler);

module.exports = app;
