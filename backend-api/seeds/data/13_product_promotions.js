const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const products = await knex("products").select("id");
  const promotions = await knex("promotions").select("id");

  const data = products.map((p) => ({
    product_id: p.id,
    promotion_id: faker.helpers.arrayElement(promotions).id,
  }));

  await knex("product_promotions")
    .insert(data)
    .onConflict(["product_id", "promotion_id"])
    .ignore();
};
