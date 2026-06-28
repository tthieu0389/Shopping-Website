const express = require("express");
const router = express.Router();

const blogController = require("../controller/blog.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const pagination = require("../middlewares/pagination");

const { createBlogSchema, updateBlogSchema } = require("../schema/blog.schema");

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
