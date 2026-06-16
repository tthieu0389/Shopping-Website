const knex = require("../database/knex");
const bcrypt = require("bcrypt");

exports.createUser = async (data) => {
  const exists = await knex("users").where("email", data.email).first();
  if (exists) throw new Error("Email already in use");

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const [user] = await knex("users")
    .insert({ ...data, password: hashedPassword })
    .returning("*");

  return user;
};

exports.getAllUsers = async ({ limit, offset }) => {
  return await knex("users")
    .select("id", "name", "email", "role")
    .limit(limit)
    .offset(offset);
};

exports.updateUser = async (id, data) => {
  const [user] = await knex("users")
    .where("id", id)
    .update(data)
    .returning(["id", "name", "email", "role"]);
  return user;
};

exports.deleteUser = async (id) => {
  return await knex("users").where("id", id).del();
};
