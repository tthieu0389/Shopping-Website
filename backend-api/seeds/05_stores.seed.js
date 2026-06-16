const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const data = Array.from({ length: 3 }, () => ({
    name: faker.company.name(),
    province: faker.location.city(),
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
  }));

  await knex("stores").insert(data);
};
