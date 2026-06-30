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

  // Check đã review chưa (kể cả review đã bị xóa mềm, vì DB có UNIQUE(user_id, product_id))
  const existing = await knex("reviews")
    .where({ user_id: userId, product_id: data.product_id })
    .first();

  if (existing && !existing.is_deleted) {
    const err = new Error("Bạn đã đánh giá sản phẩm này rồi");
    err.statusCode = 409;
    throw err;
  }

  if (existing && existing.is_deleted) {
    const [revived] = await knex("reviews")
      .where({ id: existing.id })
      .update({
        rating: data.rating,
        comment: data.comment,
        is_deleted: false,
        created_at: knex.fn.now(),
      })
      .returning("*");
    return revived;
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

// DELETE (soft) - chu so huu hoac admin (kiem duyet) deu xoa duoc
exports.deleteReview = async (id, userId, userRole) => {
  const review = await knex("reviews").where({ id }).first();

  if (!review) {
    const err = new Error("Review not found");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = review.user_id === userId;
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const err = new Error("Forbidden: bạn không có quyền xóa đánh giá này");
    err.statusCode = 403;
    throw err;
  }

  return knex("reviews").where({ id }).update({ is_deleted: true });
};
