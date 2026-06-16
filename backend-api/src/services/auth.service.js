const knex = require("../database/knex");
require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (data) => {
  const trx = await knex.transaction();

  try {
    const { name, email, password } = data;

    const exists = await trx("users").where("email", email).first();

    if (exists) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await trx("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      })
      .returning(["id", "name", "email", "role"]);

    // Tạo profile mặc định
    await trx("user_profiles").insert({
      user_id: user.id,
    });

    // Tạo cart mặc định
    await trx("carts").insert({
      user_id: user.id,
    });

    await trx.commit();

    return user;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

exports.login = async (data) => {
  const { email, password } = data;

  const user = await knex("users")
    .where({
      email,
      is_deleted: false,
    })
    .first();

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};
