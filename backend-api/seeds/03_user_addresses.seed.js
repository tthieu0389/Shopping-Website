const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");

  const data = users.map((u) => ({
    user_id: u.id,
    receiver_name: faker.person.fullName(),
    phone: faker.phone.number(),
    province: faker.location.city(),
    district: faker.location.city(),
    ward: faker.location.street(),
    address_line: faker.location.streetAddress(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    is_default: true,
  }));

  await knex("user_addresses").insert(data);
};
