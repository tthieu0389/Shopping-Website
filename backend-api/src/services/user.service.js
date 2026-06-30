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

exports.getAllUsers = async ({ limit, offset, search }) => {
  let base = knex("users").where({ is_deleted: false });

  // Tìm theo tên hoặc email (không phân biệt hoa thường)
  if (search) {
    base = base.where((qb) => {
      qb.whereILike("name", `%${search}%`).orWhereILike("email", `%${search}%`);
    });
  }

  const [{ count }] = await base.clone().count("* as count");

  const data = await base
    .select("id", "name", "email", "role")
    .orderBy("id", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(count) };
};

exports.updateUser = async (id, data) => {
  const [user] = await knex("users")
    .where({ id, is_deleted: false })
    .update(data)
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
