const knex = require("../database/knex");

exports.createProductImage = async (data) => {
  const [img] = await knex("product_images").insert(data).returning("*");

  return img;
};

exports.createManyProductImages = async (images) => {
  return await knex("product_images").insert(images).returning("*");
};

exports.getImagesByProductId = async (product_id) => {
  return await knex("product_images")
    .where({ product_id })
    .select("*")
    .orderBy("id", "asc");
};

exports.deleteImage = async (id) => {
  return await knex("product_images").where({ id }).del();
};

exports.setThumbnail = async (id, product_id) => {
  return await knex.transaction(async (trx) => {
    // reset all thumbnails of product
    await trx("product_images")
      .where({ product_id })
      .update({ is_thumbnail: false });

    // set new thumbnail
    const [img] = await trx("product_images")
      .where({ id })
      .update({ is_thumbnail: true })
      .returning("*");

    return img;
  });
};
