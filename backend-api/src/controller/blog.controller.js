const service = require("../services/blog.service");

// CREATE
exports.create = async (req, res, next) => {
  try {
    const data = await service.createBlog(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

// GET ALL
exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getBlogs();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// GET BY SLUG
exports.getBySlug = async (req, res, next) => {
  try {
    const data = await service.getBySlug(req.params.slug);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// UPDATE
exports.update = async (req, res, next) => {
  try {
    const data = await service.updateBlog(req.params.id, req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// DELETE (soft)
exports.delete = async (req, res, next) => {
  try {
    const data = await service.deleteBlog(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
