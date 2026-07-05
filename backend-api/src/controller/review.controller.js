const service = require("../services/review.service");

exports.create = async (req, res, next) => {
  try {
    const data = await service.createReview(req.user.id, req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

exports.getByProduct = async (req, res, next) => {
  try {
    // Supports both query (?product_id=xxx) and param (:productId)
    const productId = req.query.product_id || req.params.productId;
    // Route này không bắt buộc đăng nhập nên req.user có thể không tồn tại.
    // Nếu đã đăng nhập, truyền userId để review của bản thân được ưu tiên lên đầu.
    const currentUserId = req.user?.id ?? null;
    const data = await service.getProductReviews(productId, currentUserId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// GET FEATURED REVIEWS - dùng cho trang chủ, không cần đăng nhập
exports.getFeatured = async (req, res, next) => {
  try {
    const data = await service.getFeaturedReviews(req.query.limit);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// GET ALL REVIEWS (ADMIN)
exports.getAllForAdmin = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const result = await service.getAllReviewsForAdmin({
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      search: req.query.q || req.query.search,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteReview(req.params.id, req.user.id, req.user.role);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
