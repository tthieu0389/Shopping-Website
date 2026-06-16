const knex = require("../database/knex");

exports.getProductDetailsByProductId = async (product_id) => {
  return await knex("product_details as pd")
    .leftJoin("products as p", "pd.product_id", "p.id")
    .select(
      "pd.id",
      "pd.product_id",
      "pd.detail_name",
      "pd.detail_value",
      "p.name as product_name",
    )
    .where("pd.product_id", product_id);
};

exports.createProductDetail = async (data) => {
  const [inserted] = await knex("product_details").insert(data).returning("*");

  return inserted;
};

exports.updateProductDetail = async (id, data) => {
  const [updated] = await knex("product_details")
    .where({ id })
    .update(data)
    .returning("*");

  return updated;
};

exports.deleteProductDetail = async (id) => {
  return await knex("product_details").where({ id }).del();
};
