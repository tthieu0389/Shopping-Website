const express = require("express");
const router = express.Router();
const categoryController = require("../controller/category.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../schema/category.schema");

router.get("/", categoryController.getAllCategories);
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  validate(createCategorySchema),
  categoryController.createCategory
);
router.put(
  "/:id",
  verifyToken,
  checkRole("admin"),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  categoryController.deleteCategory
);

module.exports = router;
