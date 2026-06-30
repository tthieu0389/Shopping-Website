const knex = require("../database/knex");
const bcrypt = require("bcrypt");

exports.createUser = async (data) => {
  const exists = await knex("users")
    .where({ email: data.email, is_deleted: false })
    .first();
  if (exists) throw new Error("Email already in use");

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const [user] = await knex("users")
    .insert({ ...data, password: hashedPassword })
    .returning(["id", "name", "email", "role"]);

  return user;
};

exports.getAllUsers = async ({ limit = 10, offset = 0, search }) => {
  // Chuẩn hóa đầu vào ngay từ đầu
  const searchTerm = typeof search === "string" ? search.trim() : "";
  const pageSize = Math.min(Number(limit) || 10, 300);
  const pageOffset = Math.max(Number(offset) || 0, 0);

  // Xây dựng base query
  let base = knex("users").where({ is_deleted: false });

  // Chỉ áp dụng filter khi có từ khóa thực sự
  if (searchTerm.length > 0) {
    base = base.where((qb) => {
      qb.whereILike("name", `%${searchTerm}%`).orWhereILike(
        "email",
        `%${searchTerm}%`,
      );
    });
  }

  const [{ count }] = await base.clone().count("* as count");
  const total = parseInt(count) || 0;

  // Truy vấn dữ liệu
  const data = await base
    .select("id", "name", "email", "role")
    .orderBy("id", "desc")
    .limit(pageSize)
    .offset(pageOffset);

  return { data, total };
};

exports.updateUser = async (id, data) => {
  const payload = { ...data };
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }
  const [user] = await knex("users")
    .where({ id, is_deleted: false })
    .update(payload)
    .returning(["id", "name", "email", "role"]);
  return user;
};

exports.deleteUser = async (id) => {
  const [user] = await knex("users")
    .where({ id, is_deleted: false })
    .update({ is_deleted: true })
    .returning(["id", "name", "email", "role"]);

  if (!user) throw new Error("User not found or already deleted");
  return user;
};
