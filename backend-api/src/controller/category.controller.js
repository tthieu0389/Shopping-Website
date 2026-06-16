const categoryService = require("../services/category.service");

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
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
      req.body
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
