const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");

  const data = users.map((u) => ({
    user_id: u.id,
    full_name: faker.person.fullName(),
    date_of_birth: faker.date.birthdate(),
    gender: faker.helpers.arrayElement(["male", "female"]),
    phone: faker.phone.number(),
  }));

  await knex("user_profiles").insert(data).onConflict("user_id").merge();
};
