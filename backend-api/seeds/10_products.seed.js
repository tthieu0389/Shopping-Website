const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const categories = await knex("categories").select("id");

  const data = Array.from({ length: 20 }, () => {
    const name = faker.commerce.productName();

    return {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      description: faker.commerce.productDescription(),
      price: faker.number.int({ min: 100, max: 5000 }),
      stock: faker.number.int({ min: 0, max: 200 }),
      product_type: faker.helpers.arrayElement([
        "sim",
        "device",
        "internet",
        "tv",
        "accessory",
      ]),
      category_id: faker.helpers.arrayElement(categories).id,
    };
  });

  await knex("products").insert(data);
};
