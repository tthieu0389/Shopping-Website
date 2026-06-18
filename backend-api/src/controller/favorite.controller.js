const service = require("../services/favorite.service");

// Add product to favorites
exports.add = async (req, res, next) => {
  try {
    const data = await service.addFavorite(req.user.id, req.body.product_id);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

// Get current user's favorites
exports.get = async (req, res, next) => {
  try {
    const data = await service.getFavorites(req.user.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Remove from favorites
exports.remove = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    await service.removeFavorite(req.user.id, productId);
    res.json({ message: "Removed" });
  } catch (err) {
    next(err);
  }
};
