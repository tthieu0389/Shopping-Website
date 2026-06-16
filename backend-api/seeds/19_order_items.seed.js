const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const orders = await knex("orders").select("id");
  const products = await knex("products").select("id", "name", "price");

  const data = [];

  for (const order of orders) {
    const product = faker.helpers.arrayElement(products);

    data.push({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity: faker.number.int({ min: 1, max: 3 }),
      price: product.price,
      discount_amount: 0,
    });
  }

  await knex("order_items").insert(data);
};
