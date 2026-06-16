const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const data = Array.from({ length: 5 }, () => {
    const name = faker.commerce.department();
    return {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    };
  });

  await knex("categories").insert(data);
};
