const knex = require("../database/knex");

// CREATE REVIEW
exports.createReview = async (userId, data) => {
  // Check user đã mua và nhận hàng thành công chưa
  const purchased = await knex("order_items as oi")
    .join("orders as o", "oi.order_id", "o.id")
    .where({
      "o.user_id": userId,
      "oi.product_id": data.product_id,
      "o.status": "completed",
    })
    .first();

  if (!purchased) {
    const err = new Error(
      "Bạn cần mua và nhận hàng thành công trước khi đánh giá sản phẩm này",
    );
    err.statusCode = 403;
    throw err;
  }

  // Check đã review chưa (1 user 1 review / product)
  const existing = await knex("reviews")
    .where({ user_id: userId, product_id: data.product_id, is_deleted: false })
    .first();

  if (existing) {
    const err = new Error("Bạn đã đánh giá sản phẩm này rồi");
    err.statusCode = 409;
    throw err;
  }

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
