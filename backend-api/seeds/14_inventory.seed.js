const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const products = await knex("products").select("id");

  const data = products.map((p) => ({
    product_id: p.id,
    quantity: faker.number.int({ min: 0, max: 200 }),
    min_quantity: 10,
    status: "active",
  }));

  await knex("inventory").insert(data).onConflict("product_id").merge();
};
