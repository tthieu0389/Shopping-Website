const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const data = Array.from({ length: 3 }, () => ({
    name: faker.commerce.productName(),
    discount_type: "percent",
    discount_value: faker.number.int({ min: 5, max: 30 }),
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 86400000),
  }));

  await knex("promotions").insert(data);
};
