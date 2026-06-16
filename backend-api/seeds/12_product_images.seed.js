const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const products = await knex("products").select("id");

  const data = products.flatMap((p) =>
    Array.from({ length: 3 }, () => ({
      product_id: p.id,
      image_url: faker.image.urlPicsumPhotos({
        width: 600,
        height: 600,
      }),
    })),
  );

  await knex("product_images").insert(data);
};
