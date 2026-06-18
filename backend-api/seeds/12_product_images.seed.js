const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const products = await knex("products").select("id");

  const data = products.flatMap((p) => {
    return Array.from({ length: 3 }, (_, index) => {
      return {
        product_id: p.id,
        image_url: faker.image.url({
          width: 600,
          height: 600,
        }),

        // ảnh đầu tiên làm thumbnail
        is_thumbnail: index === 0,
      };
    });
  });

  await knex("product_images").insert(data);
};
