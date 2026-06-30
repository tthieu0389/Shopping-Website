const { faker } = require("@faker-js/faker/locale/vi");

function createBlog() {
  const title = faker.lorem.sentence(6).replace(/\.$/, "");
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return {
    title,
    slug,
    content: faker.lorem.paragraphs(3),
    thumbnail_url: `https://picsum.photos/seed/${slug.slice(0, 12)}/1200/630`,
  };
}

exports.seed = async function (knex) {
  const data = Array.from({ length: 5 }, createBlog);
  await knex("blogs").insert(data);
};
