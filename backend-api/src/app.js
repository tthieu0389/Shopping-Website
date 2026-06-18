const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const compression = require("compression");
const morgan = require("morgan");
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

// MIDDLEWARE BAO MAT
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Cho phep frontend tai anh tu public folder
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL, // Chỉ cho phép domain của frontend kết nối
    credentials: true, // Cho phép truyền cookie / token qua các domain khác nhau
  }),
);

app.set("trust proxy", 1);

// MIDDLEWARE TOI UU HIEU NANG
app.use(compression()); // Nén dữ liệu JSON trả về để tiết kiệm băng thông và tăng tốc API
app.use(express.json({ limit: "1mb" })); // Giới hạn dung lượng request body chống DOS
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// GHI LOG MOI TRUONG PHAT TRIEN
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // In các request API ra terminal để debug
}

// CAU HINH THU MUC TINH (ANH SAN PHAM)
app.use("/public", express.static(path.join(process.cwd(), "public")));

// ROUTE
app.use("/api-docs", require("./routes/swagger"));
app.use("/api/auth", loginLimiter, require("./routes/auth.routes"));
app.use("/api/blogs", blogLimiter, require("./routes/blog.routes"));
app.use("/api/cart", cartLimiter, require("./routes/cart.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/contacts", contactLimiter, require("./routes/contact.routes"));
app.use("/api/favorites", favoriteLimiter, require("./routes/favorite.routes"));
app.use(
  "/api/inventory",
  inventoryLimiter,
  require("./routes/inventory.routes"),
);
app.use("/api/inventory-logs", require("./routes/inventoryLog.routes"));
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
app.use("/api/reviews", reviewLimiter, require("./routes/review.routes"));
app.use("/api/stores", require("./routes/store.routes"));
app.use("/api/users", userLimiter, require("./routes/user.routes"));

// ── ĐÃ CHỈNH SỬA: Đồng bộ Số ít (Singular) theo file API của Frontend ──
app.use("/api/user-address", require("./routes/useraddress.routes"));
app.use("/api/user-payment", require("./routes/userpayment.routes"));
app.use("/api/user-profile", require("./routes/userprofile.routes"));

// KIEM TRA TRANG THAI SERVER
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// XU LY ROUTE KHONG TON TAI (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API Route not found", // Đồng bộ cấu trúc lỗi toàn hệ thống
  });
});

// GLOBAL ERROR HANDLER
app.use(errorHandler);

module.exports = app;
