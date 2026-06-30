// Map mã lỗi Postgres phổ biến sang HTTP status + message,
// tránh việc lỗi DB rơi thẳng thành 500 kèm câu SQL gốc lộ ra ngoài
const PG_ERROR_MAP = {
  23505: { status: 409, message: "Dữ liệu đã tồn tại (trùng khóa duy nhất)." },
  23503: {
    status: 409,
    message: "Dữ liệu đang được tham chiếu hoặc không hợp lệ (khóa ngoại).",
  },
  23502: { status: 400, message: "Thiếu dữ liệu bắt buộc." },
  23514: {
    status: 400,
    message: "Dữ liệu không thỏa điều kiện hợp lệ (check constraint).",
  },
  "22P02": { status: 400, message: "Dữ liệu gửi lên không đúng định dạng." },
};

module.exports = (err, req, res, next) => {
  const pgError = err.code && PG_ERROR_MAP[err.code];

  const status = err.statusCode || (pgError ? pgError.status : 500);
  const message = pgError
    ? pgError.message
    : err.message || "Internal server error";

  // Log chi tiết kèm Path và Method
  if (status >= 500) {
    console.error({
      error: err.message || message,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack, // Hiện file nào, dòng mấy bị lỗi ngầm
    });
  }

  // Bảo mật thông tin, giấu lỗi 500 nhạy cảm với Client
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : "Bad request", // Nhãn bao quát
    error:
      status === 500 ? "Hệ thống gặp sự cố, vui lòng thử lại sau." : message, // Chi tiết lỗi (chỉ hiện lỗi thật nếu là lỗi 4xx do client)
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
