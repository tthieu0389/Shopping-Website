const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

// ADD PRODUCT TO PROMOTION
exports.addProductPromotion = async (data) => {
  const [row] = await knex("product_promotions").insert(data).returning("*");

  return row;
};

// GET ALL (phân trang + lọc theo product_id/promotion_id + tìm theo tên
// sản phẩm hoặc tên chương trình khuyến mãi)
exports.getAll = async ({
  limit = 10,
  offset = 0,
  product_id,
  promotion_id,
  search,
} = {}) => {
  const kw = normalizeKeyword(search);

  const baseQuery = () => {
    const q = knex("product_promotions")
      .join("products", "product_promotions.product_id", "products.id")
      .join("promotions", "product_promotions.promotion_id", "promotions.id");

    if (product_id) {
      q.where("product_promotions.product_id", product_id);
    }
    if (promotion_id) {
      q.where("product_promotions.promotion_id", promotion_id);
    }
    if (kw) {
      q.andWhere((qb) => {
        qb.where("products.name", "ilike", `%${kw}%`).orWhere(
          "promotions.name",
          "ilike",
          `%${kw}%`,
        );
      });
    }
    return q;
  };

  const data = await baseQuery()
    .select(
      "product_promotions.id",
      "product_promotions.product_id",
      "products.name as product_name",
      "product_promotions.promotion_id",
      "promotions.name as promotion_name",
      "promotions.discount_type",
      "promotions.discount_value",
    )
    .orderBy("product_promotions.id", "desc")
    .limit(limit)
    .offset(offset);

  const [{ count }] = await baseQuery().count("product_promotions.id as count");

  return { data, total: Number(count) };
};

// DELETE
exports.delete = async (id) => {
  return knex("product_promotions").where({ id }).del();
};
