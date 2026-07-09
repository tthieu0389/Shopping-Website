const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config();

const errorHandler = require("./middlewares/errorHandler");
const verifyToken = require("./middlewares/verifyToken");
const checkRole = require("./middlewares/checkRole");
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
  categoryLimiter,
  storeLimiter,
  blogImageLimiter,
  inventoryLogLimiter,
  userAddressLimiter,
  userPaymentLimiter,
  userProfileLimiter,
  docsLimiter,
} = require("./middlewares/RateLimit");

const app = express();

app.disable("etag");
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Middleware bao mat
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Cho phep frontend tai anh tu public folder
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL, // Chi cho phep domain cua frontend ket noi
    credentials: true, // Cho phep truyen cookie / token qua cac domain khac nhau
  }),
);

app.set("trust proxy", 1);

// Middleware toi uu hieu nang
app.use(compression()); // Nen du lieu JSON tra ve de tiet kiem bang thong va tang toc API
app.use(express.json({ limit: "1mb" })); // Gioi han dung luong request body chong DOS
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Ghi log moi truong phat trien
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // In cac request API ra terminal de debug
}

// Cau hinh thu muc tinh (anh san pham)
app.use("/public", express.static(path.join(process.cwd(), "public")));

// Chan swagger ở môi trườnng production
// Mặc định trả 404, không để lộ endpoint, schema, model data ra ngoài
// Nếu cần bật tạm để debug production, set ENABLE_SWAGGER_IN_PROD=true trong .env
const swaggerAccessGuard = (req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) return next();

  if (process.env.ENABLE_SWAGGER_IN_PROD !== "true") {
    return res.status(404).json({
      success: false,
      error: "API Route not found",
    });
  }

  return verifyToken()(req, res, () => checkRole("admin")(req, res, next));
};

// Route
app.use(
  "/api-docs",
  docsLimiter,
  swaggerAccessGuard,
  require("./routes/swagger"),
);
app.use("/api/auth", loginLimiter, require("./routes/auth.routes"));
app.use("/api/blogs", blogLimiter, require("./routes/blog.routes"));
app.use("/api/cart", cartLimiter, require("./routes/cart.routes"));
app.use(
  "/api/categories",
  categoryLimiter,
  require("./routes/category.routes"),
);
app.use("/api/contacts", contactLimiter, require("./routes/contact.routes"));
app.use("/api/favorites", favoriteLimiter, require("./routes/favorite.routes"));
app.use(
  "/api/inventory",
  inventoryLimiter,
  require("./routes/inventory.routes"),
);
app.use(
  "/api/inventory-logs",
  inventoryLogLimiter,
  require("./routes/inventoryLog.routes"),
);
app.use("/api/orders", orderLimiter, require("./routes/order.routes"));
app.use(
  "/api/order-items",
  orderItemLimiter,
  require("./routes/orderitem.routes"),
);
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
app.use(
  "/api/blog-images",
  blogImageLimiter,
  require("./routes/blogimage.routes"),
);
app.use("/api/reviews", reviewLimiter, require("./routes/review.routes"));
app.use("/api/stores", storeLimiter, require("./routes/store.routes"));
app.use("/api/users", userLimiter, require("./routes/user.routes"));

app.use(
  "/api/user-address",
  userAddressLimiter,
  require("./routes/useraddress.routes"),
);
app.use(
  "/api/user-payment",
  userPaymentLimiter,
  require("./routes/userpayment.routes"),
);
app.use(
  "/api/user-profile",
  userProfileLimiter,
  require("./routes/userprofile.routes"),
);

// Kiem tra trang thai server
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Xu ly route khong ton tai (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API Route not found", // Dong bo cau truc loi toan he thong
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
