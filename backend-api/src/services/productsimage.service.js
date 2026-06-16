const knex = require("../database/knex");

exports.createProductImage = async (data) => {
  const [img] = await knex("product_images").insert(data).returning("*");

  return img;
};

exports.createManyProductImages = async (images) => {
  return await knex("product_images").insert(images).returning("*");
};

exports.getImagesByProductId = async (product_id) => {
  return await knex("product_images").where({ product_id }).select("*");
};

exports.deleteImage = async (id) => {
  return await knex("product_images").where({ id }).del();
};
