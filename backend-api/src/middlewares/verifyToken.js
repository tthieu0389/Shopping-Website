const jwt = require("jsonwebtoken");
const knex = require("../database/knex");

/**
 * verifyToken(options?)
 * options:
 *  - optional: boolean (cho phép route không cần token)
 */
module.exports = (options = {}) => {
  return async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      if (options.optional) return next();

      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Token sai/hết hạn -> 401 (403 dành riêng cho thiếu quyền ở checkRole)
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    try {
      // Token còn hợp lệ không check lại DB để bắt kịp trường hợp tài khoản đã bị xoá
      const user = await knex("users")
        .where({ id: decoded.id, is_deleted: false })
        .first();

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Tài khoản không còn tồn tại hoặc đã bị vô hiệu hoá",
        });
      }

      // Lấy role mới nhất từ DB, không tin theo token cũ (tránh trường hợp
      // đã bị hạ quyền nhưng token cũ chưa hết hạn vẫn mang quyền cao)
      req.user = {
        id: user.id,
        role: user.role,
        email: user.email,
      };
      next();
    } catch (err) {
      next(err); // lỗi DB thật -> để errorHandler xử lý
    }
  };
};
