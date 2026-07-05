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
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    const result = await service.getAll({
      limit,
      offset,
      product_id: req.query.product_id,
      promotion_id: req.query.promotion_id,
      search: req.query.q || req.query.search,
    });

    res.json({ data: result.data, total: result.total, page, limit });
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
