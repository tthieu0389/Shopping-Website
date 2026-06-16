const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");
  const products = await knex("products").select("id");

  const data = Array.from({ length: 20 }, () => {
    const user = faker.helpers.arrayElement(users);
    const product = faker.helpers.arrayElement(products);

    return {
      user_id: user.id,
      product_id: product.id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      is_deleted: false,
    };
  });

  await knex("reviews").insert(data);
};
