const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const blogImageController = require("../controller/blogimage.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const {
  uploadBlogImageSchema,
  attachBlogImageSchema,
} = require("../schema/blogimage.schema");

// UPLOAD 1 ẢNH (paste vào content hoặc chọn thumbnail)
router.post(
  "/upload",
  verifyToken(),
  checkRole("admin"),
  upload("blogs").single("image"),
  validate(uploadBlogImageSchema),
  blogImageController.uploadImage,
);

// GET IMAGES BY BLOG
router.get("/blog/:blogId", blogImageController.getByBlogId);

// GẮN ẢNH MỒ CÔI VÀO BLOG SAU KHI BLOG ĐƯỢC LƯU
router.patch(
  "/:id/attach",
  verifyToken(),
  checkRole("admin"),
  validate(attachBlogImageSchema),
  blogImageController.attach,
);

// DỌN ẢNH KHÔNG CÒN DÙNG TRONG CONTENT (gọi sau khi save blog)
router.post(
  "/blog/:blogId/prune",
  verifyToken(),
  checkRole("admin"),
  blogImageController.pruneUnused,
);

// DELETE IMAGE
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  blogImageController.deleteImage,
);

module.exports = router;
