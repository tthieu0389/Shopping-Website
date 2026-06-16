const { faker } = require("@faker-js/faker/locale/vi");

function createBlog() {
  const title = faker.lorem.sentence(6);

  return {
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    content: faker.lorem.paragraphs(3),
  };
}

exports.seed = async function (knex) {
  const data = Array.from({ length: 5 }, createBlog);

  await knex("blogs").insert(data);
};
