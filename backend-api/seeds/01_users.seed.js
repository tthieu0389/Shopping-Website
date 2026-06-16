const { faker } = require("@faker-js/faker/locale/vi");

function createUser() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: faker.helpers.arrayElement(["user", "admin"]),
    is_deleted: false,
  };
}

exports.seed = async function (knex) {
  const data = Array.from({ length: 10 }, createUser);

  await knex("users").insert(data).onConflict("email").merge();
};
