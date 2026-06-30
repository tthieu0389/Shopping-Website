const express = require("express");
const router = express.Router();

const blogController = require("../controller/blog.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const pagination = require("../middlewares/pagination");
const upload = require("../middlewares/upload");

const { createBlogSchema, updateBlogSchema } = require("../schema/blog.schema");

// UPLOAD THUMBNAIL CHO BLOG (admin)
router.post(
  "/upload-thumbnail",
  verifyToken(),
  checkRole("admin"),
  upload("blogs").single("image"),
  blogController.uploadThumbnail,
);

// CREATE BLOG (admin)
router.post(
  "/",
  verifyToken(),
  checkRole("admin"),
  validate(createBlogSchema),
  blogController.create,
);

// GET ALL BLOGS (public)
router.get("/", pagination(), blogController.getAll);

// GET BLOG BY SLUG
router.get("/slug/:slug", blogController.getBySlug);

// GET BLOG BY ID (đặt sau /slug/:slug để tránh conflict)
router.get("/:id", blogController.getById);

// UPDATE BLOG (admin)
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updateBlogSchema),
  blogController.update,
);

// DELETE BLOG (admin soft delete)
router.delete("/:id", verifyToken(), checkRole("admin"), blogController.delete);

module.exports = router;
