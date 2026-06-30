const service = require("../services/blog.service");

// UPLOAD THUMBNAIL
exports.uploadThumbnail = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }
    const url = `/public/uploads/blogs/${req.file.filename}`;
    res.status(201).json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
};

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
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };
    const result = await service.getBlogs({ limit, offset });
    res.json({ data: result.data, total: result.total, page, limit });
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

// GET BY ID
exports.getById = async (req, res, next) => {
  try {
    const data = await service.getBlogById(req.params.id);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
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
