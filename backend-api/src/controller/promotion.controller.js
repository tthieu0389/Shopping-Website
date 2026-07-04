const service = require("../services/promotion.service");

exports.create = async (req, res, next) => {
  try {
    const data = await service.createPromotion(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getAllPromotions();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Danh sách sản phẩm đang được giảm giá (public, dùng cho trang KM / Flash Sale)
exports.getDiscountedProducts = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const { data, total } = await service.getDiscountedProducts({
      limit,
      offset,
    });

    // xóa field này đi cho response gọn lại.
    res.json({
      success: true,
      data,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await service.getPromotionById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await service.updatePromotion(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await service.deletePromotion(req.params.id);
    res.json({ message: ok ? "Deleted" : "Not found" });
  } catch (err) {
    next(err);
  }
};
