const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");
  const products = await knex("products").select("id");

  const data = users.flatMap((u) =>
    Array.from({ length: 3 }, () => ({
      user_id: u.id,
      product_id: faker.helpers.arrayElement(products).id,
      is_deleted: false,
    })),
  );

  await knex("favorites").insert(data);
};
