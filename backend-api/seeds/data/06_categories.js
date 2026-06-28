const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const uniqueNames = Array.from(
    new Set(Array.from({ length: 20 }, () => faker.commerce.department())),
  ).slice(0, 5);

  const data = uniqueNames.map((name, i) => ({
    name,
    slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`,
    description: faker.commerce.productDescription(),
  }));

  await knex("categories").insert(data);
};
