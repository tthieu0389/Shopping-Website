const knex = require("../database/knex");

// ADD PRODUCT TO PROMOTION
exports.addProductPromotion = async (data) => {
  const [row] = await knex("product_promotions").insert(data).returning("*");

  return row;
};

// GET ALL
exports.getAll = async () => {
  return knex("product_promotions")
    .join("products", "product_promotions.product_id", "products.id")
    .join("promotions", "product_promotions.promotion_id", "promotions.id")
    .select(
      "product_promotions.id",
      "product_promotions.product_id",
      "products.name as product_name",
      "promotions.name as promotion_name",
      "promotions.discount_type",
      "promotions.discount_value",
    );
};

// DELETE
exports.delete = async (id) => {
  return knex("product_promotions").where({ id }).del();
};
