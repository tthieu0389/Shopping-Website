const knex = require("../database/knex");
const bcrypt = require("bcrypt");
const { normalizeKeyword } = require("../utils/searchKeyword");

const ALLOWED_ROLES = ["admin", "staff", "user"];

exports.createUser = async (data) => {
  const exists = await knex("users")
    .where({ email: data.email, is_deleted: false })
    .first();
  if (exists) throw new Error("Email already in use");
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const [user] = await knex("users")
    .insert({ ...data, password: hashedPassword })
    .returning(["id", "name", "email", "role", "created_at"]);
  return user;
};

exports.getAllUsers = async ({ limit = 10, offset = 0, search, role }) => {
  // Chuẩn hóa đầu vào ngay từ đầu (trim + gộp khoảng trắng thừa)
  const searchTerm = normalizeKeyword(search);
  const pageSize = Math.min(Number(limit) || 10, 300);
  const pageOffset = Math.max(Number(offset) || 0, 0);

  // Xây dựng base query (join user_profiles để search được cả theo SĐT)
  let base = knex("users as u")
    .leftJoin("user_profiles as p", "u.id", "p.user_id")
    .where({ "u.is_deleted": false });

  // Chỉ áp dụng filter khi có từ khóa thực sự
  if (searchTerm.length > 0) {
    base = base.where((qb) => {
      qb.whereILike("u.name", `%${searchTerm}%`)
        .orWhereILike("u.email", `%${searchTerm}%`)
        .orWhere("p.phone", "like", `%${searchTerm}%`);
    });
  }

  // Filter theo role (Khách hàng / Nhân viên / Quản trị viên trên UI)
  if (role && ALLOWED_ROLES.includes(role)) {
    base = base.where("u.role", role);
  }

  const [{ count }] = await base.clone().countDistinct("u.id as count");
  const total = parseInt(count) || 0;

  // Truy vấn dữ liệu
  const data = await base
    .distinct(
      "u.id",
      "u.name",
      "u.email",
      "u.role",
      "p.phone",
      "u.created_at",
      "p.avatar",
    )
    .orderBy("u.id", "desc")
    .limit(pageSize)
    .offset(pageOffset);

  return { data, total };
};

// Đếm số admin đang hoạt động (chưa xoá) — dùng để chặn hạ quyền/xoá admin
// cuối cùng, tránh hệ thống mất sạch tài khoản admin (không ai tạo lại được
// admin mới vì tạo user cần quyền admin).
const countActiveAdmins = async (excludeId = null) => {
  let q = knex("users").where({ role: "admin", is_deleted: false });
  if (excludeId) q = q.whereNot("id", excludeId);
  const [{ count }] = await q.count("id as count");
  return Number(count);
};

exports.updateUser = async (id, data, currentUserId = null) => {
  const payload = { ...data };

  if (payload.role !== undefined) {
    if (!ALLOWED_ROLES.includes(payload.role)) {
      const err = new Error("Role không hợp lệ");
      err.statusCode = 400;
      throw err;
    }

    // Chặn tự đổi role của chính mình — tránh admin tự hạ quyền bản thân
    // rồi mất quyền quản trị giữa chừng, không ai khôi phục lại được.
    if (currentUserId !== null && Number(id) === Number(currentUserId)) {
      const err = new Error("Không thể tự thay đổi role của chính mình");
      err.statusCode = 400;
      throw err;
    }

    // Nếu đang hạ quyền 1 admin xuống role khác
    // thì chặn nếu đây là admin cuối cùng còn lại trong hệ thống.
    if (payload.role !== "admin") {
      const target = await knex("users")
        .where({ id, is_deleted: false })
        .first();
      if (target && target.role === "admin") {
        const remaining = await countActiveAdmins(id);
        if (remaining === 0) {
          const err = new Error(
            "Không thể hạ quyền admin cuối cùng trong hệ thống",
          );
          err.statusCode = 409;
          throw err;
        }
      }
    }
  }

  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }
  const [user] = await knex("users")
    .where({ id, is_deleted: false })
    .update(payload)
    .returning(["id", "name", "email", "role"]);
  return user;
};

exports.deleteUser = async (id, currentUserId = null) => {
  // Chặn tự xoá tài khoản đang đăng nhập của chính mình.
  if (currentUserId !== null && Number(id) === Number(currentUserId)) {
    const err = new Error("Không thể tự xoá tài khoản của chính mình");
    err.statusCode = 400;
    throw err;
  }

  const target = await knex("users").where({ id, is_deleted: false }).first();
  if (!target) {
    const err = new Error("User not found or already deleted");
    err.statusCode = 404;
    throw err;
  }

  // Chặn xoá admin cuối cùng còn lại trong hệ thống.
  if (target.role === "admin") {
    const remaining = await countActiveAdmins(id);
    if (remaining === 0) {
      const err = new Error("Không thể xoá admin cuối cùng trong hệ thống");
      err.statusCode = 409;
      throw err;
    }
  }

  const [user] = await knex("users")
    .where({ id, is_deleted: false })
    .update({ is_deleted: true })
    .returning(["id", "name", "email", "role"]);

  return user;
};
