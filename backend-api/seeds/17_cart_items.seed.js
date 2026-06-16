const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const carts = await knex("carts").select("id");
  const products = await knex("products").select("id");

  const data = carts.flatMap((cart) =>
    Array.from({ length: 3 }, () => ({
      cart_id: cart.id,
      product_id: faker.helpers.arrayElement(products).id,
      quantity: faker.number.int({ min: 1, max: 5 }),
    })),
  );

  await knex("cart_items")
    .insert(data)
    .onConflict(["cart_id", "product_id"])
    .ignore();
};
