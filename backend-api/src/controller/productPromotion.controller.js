const service = require("../services/productPromotion.service");

exports.add = async (req, res, next) => {
  try {
    const data = await service.addProductPromotion(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.delete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
