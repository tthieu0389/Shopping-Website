const { faker } = require("@faker-js/faker/locale/vi");
const bcrypt = require("bcrypt");

async function createUser() {
  const hashedPassword = await bcrypt.hash("123456", 10);
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: hashedPassword,
    role: faker.helpers.arrayElement(["user", "admin"]),
    is_deleted: false,
  };
}

exports.seed = async function (knex) {
  const data = await Promise.all(Array.from({ length: 10 }, createUser));
  await knex("users").insert(data).onConflict("email").merge();
};
