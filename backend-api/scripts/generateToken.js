require("dotenv").config(); // Tự động đọc file .env
const jwt = require("jsonwebtoken");

// Lấy secret từ biến môi trường (ví dụ: JWT_SECRET)
// Thay 'JWT_SECRET' bằng tên biến chính xác bạn thấy trong file .env
const secret = process.env.JWT_SECRET || "fallback_secret_if_env_not_found";

const payload = {
  id: 1,
  email: "hieu@example.com",
  role: "admin", // Thêm role nếu server của bạn yêu cầu
};

const token = jwt.sign(payload, secret, { expiresIn: "1h" });

console.log("Token mới của bạn là:");
console.log(token);
