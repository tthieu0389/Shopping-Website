const knex = require("../database/knex");

const checkOwnership = (tableName, allowedRoles = ["admin", "staff"]) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;

      // Cho phép các role được chỉ định can thiệp mọi thứ
      // (mặc định: admin + staff, truyền allowedRoles riêng nếu resource cần rule khác, vd chỉ admin)
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // Kiểm tra sở hữu với User thường
      const resource = await knex(tableName).where({ id: resourceId }).first();

      if (!resource) {
        return res.status(404).json({ message: "Không tìm thấy tài nguyên" });
      }

      if (resource.user_id !== userId) {
        return res.status(403).json({
          message: "Forbidden: Bạn không có quyền thao tác trên tài nguyên này",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = checkOwnership;
