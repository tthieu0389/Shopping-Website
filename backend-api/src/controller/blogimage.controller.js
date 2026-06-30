const blogImageService = require("../services/blogimage.service");

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const { blog_id, alt_text } = req.body;

    const image_url = `/public/uploads/blogs/${req.file.filename}`;

    const result = await blogImageService.createBlogImage({
      blog_id: blog_id ? Number(blog_id) : null,
      image_url,
      alt_text,
    });

    res.status(201).json({
      message: "Image uploaded successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET BY BLOG
exports.getByBlogId = async (req, res, next) => {
  try {
    const images = await blogImageService.getImagesByBlogId(req.params.blogId);

    res.json({ data: images });
  } catch (err) {
    next(err);
  }
};

// GẮN ẢNH MỒ CÔI VÀO BLOG (sau khi blog mới được lưu lần đầu)
exports.attach = async (req, res, next) => {
  try {
    const { blog_id } = req.body;
    const { id } = req.params;

    const result = await blogImageService.attachToBlog(id, blog_id);

    res.json({
      message: "Image attached to blog",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.deleteImage = async (req, res, next) => {
  try {
    await blogImageService.deleteImage(req.params.id);

    res.json({ message: "Image deleted" });
  } catch (err) {
    next(err);
  }
};

// DỌN RÁC sau khi save blog, truyền content mới nhất để xoá ảnh đã upload nhưng cuối cùng không được dùng
exports.pruneUnused = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { content } = req.body;

    if (typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "content is required",
      });
    }

    const removed = await blogImageService.pruneUnusedImages(blogId, content);

    res.json({
      message: "Unused images pruned",
      data: removed,
    });
  } catch (err) {
    next(err);
  }
};
