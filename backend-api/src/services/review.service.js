const knex = require("../database/knex");

// CREATE REVIEW
exports.createReview = async (userId, data) => {
  const [review] = await knex("reviews")
    .insert({
      user_id: userId,
      product_id: data.product_id,
      rating: data.rating,
      comment: data.comment,
    })
    .returning("*");

  return review;
};

// GET PRODUCT REVIEWS
exports.getProductReviews = async (productId) => {
  return knex("reviews as r")
    .join("users as u", "r.user_id", "u.id")
    .where("r.product_id", productId)
    .andWhere("r.is_deleted", false)
    .select("r.*", "u.name as user_name")
    .orderBy("r.created_at", "desc");
};

// DELETE (soft)
exports.deleteReview = async (id, userId) => {
  return knex("reviews")
    .where({ id, user_id: userId })
    .update({ is_deleted: true });
};
