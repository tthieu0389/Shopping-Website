const categoryService = require("../services/category.service");

exports.getAllCategories = async (req, res, next) => {
  try {
    // Chấp nhận cả 2 tên query param: q (frontend đang dùng) và search
    const keyword = (req.query.q || req.query.search || "").trim() || undefined;
    const categories = await categoryService.getAllCategories({ keyword });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ message: "Category created", data: category });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const updated = await categoryService.updateCategory(
      req.params.id,
      req.body,
    );
    res.json({ message: "Category updated", data: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);
    res.json({ message: "Category deleted", data: deleted });
  } catch (err) {
    next(err);
  }
};
