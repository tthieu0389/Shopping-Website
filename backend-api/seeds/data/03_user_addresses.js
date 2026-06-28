const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");

  const data = users.flatMap((u) => {
    const count = faker.number.int({ min: 2, max: 3 });
    return Array.from({ length: count }, (_, i) => ({
      user_id: u.id,
      receiver_name: faker.person.fullName(),
      phone: faker.phone.number(),
      province: faker.location.city(),
      district: faker.location.city(),
      ward: faker.location.street(),
      address_line: faker.location.streetAddress(),
      latitude: parseFloat(faker.location.latitude().toFixed(7)),
      longitude: parseFloat(faker.location.longitude().toFixed(7)),
      is_default: i === 0, // chỉ địa chỉ đầu tiên là mặc định
      is_deleted: false,
    }));
  });

  await knex("user_addresses").insert(data);
};
