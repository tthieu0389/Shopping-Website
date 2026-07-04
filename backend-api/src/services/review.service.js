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
// currentUserId (tuỳ chọn): nếu truyền vào, review của chính user đang xem
// sẽ được ưu tiên hiển thị lên đầu danh sách
// các review còn lại sắp theo mới nhất trước (created_at desc)
exports.getProductReviews = async (productId, currentUserId = null) => {
  return knex("reviews as r")
    .join("users as u", "r.user_id", "u.id")
    .leftJoin("user_profiles as up", "r.user_id", "up.user_id")
    .where("r.product_id", productId)
    .andWhere("r.is_deleted", false)
    .select("r.*", "u.name as user_name", "up.avatar as user_avatar")
    .orderByRaw(
      "(CASE WHEN r.user_id = ? THEN 0 ELSE 1 END) ASC, r.created_at DESC",
      [currentUserId],
    );
};

// GET FEATURED REVIEWS (dùng cho trang chủ - "Khách hàng nói gì?")
// Tiêu chí "nổi bật":
//   - rating >= 4 (không đưa review thấp sao lên trang chủ)
//   - có comment thực sự (không rỗng/toàn khoảng trắng)
//   - chưa bị xoá mềm, và sản phẩm liên quan cũng chưa bị xoá mềm
//   - lấy TỐI ĐA 1 review/sản phẩm để tránh trang chủ toàn review của 1 sản phẩm
//   - sau khi đã lấy 1 review đại diện/sản phẩm, sắp toàn bộ theo rating desc,
//     created_at desc rồi cắt còn `limit` review để hiển thị
exports.getFeaturedReviews = async (limit = 6) => {
  const safeLimit =
    isNaN(Number(limit)) || Number(limit) < 1 ? 6 : Number(limit);

  const { rows } = await knex.raw(
    `
    SELECT * FROM (
      SELECT DISTINCT ON (r.product_id)
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.product_id,
        u.name AS user_name,
        up.avatar AS user_avatar,
        p.name AS product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.is_deleted = false
        AND p.is_deleted = false
        AND r.rating >= 4
        AND r.comment IS NOT NULL
        AND trim(r.comment) <> ''
      ORDER BY r.product_id, r.rating DESC, r.created_at DESC
    ) best_per_product
    ORDER BY rating DESC, created_at DESC
    LIMIT ?
    `,
    [safeLimit],
  );

  return rows;
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
