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

    const data = await service.getProductReviews(productId);
    res.json({ data });
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
