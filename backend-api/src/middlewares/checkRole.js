module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    // Kiểm tra xem thông tin user có tồn tại từ middleware verifyToken truyền xuống không
    const userRole = req.user?.role;

    // Kiểm tra xem role của user hiện tại có nằm trong danh sách các role được phép không
    // (Nếu truyền "admin", allowedRoles sẽ là ["admin"]. Nếu truyền nhiều, nó sẽ là ["admin", "staff"])
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        error: "Bạn không có quyền truy cập vào tính năng này.",
      });
    }

    next();
  };
};
