module.exports = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Log chi tiết kèm Path và Method
  if (status >= 500) {
    console.error({
      error: message,
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
