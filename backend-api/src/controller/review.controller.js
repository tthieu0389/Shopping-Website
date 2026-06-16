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
    const data = await service.getProductReviews(req.params.productId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteReview(req.params.id, req.user.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
