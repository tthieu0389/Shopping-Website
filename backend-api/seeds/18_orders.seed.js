const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");
  const stores = await knex("stores").select("id");

  const data = Array.from({ length: 5 }, () => ({
    order_code: faker.string.alphanumeric(8).toUpperCase(),
    user_id: faker.helpers.arrayElement(users).id,
    pickup_store_id: faker.helpers.arrayElement(stores).id,
    total_amount: faker.number.int({ min: 100, max: 5000 }),
    payment_method: "cash",
    status: "pending",
  }));

  await knex("orders").insert(data).onConflict("order_code").merge();
};
