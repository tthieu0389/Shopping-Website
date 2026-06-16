const service = require("../services/favorite.service");

exports.add = async (req, res, next) => {
  try {
    const data = await service.addFavorite(req.user.id, req.body.product_id);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const data = await service.getFavorites(req.user.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.removeFavorite(req.params.id, req.user.id);
    res.json({ message: "Removed" });
  } catch (err) {
    next(err);
  }
};
