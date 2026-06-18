const express = require("express");
const router = express.Router();

const reviewController = require("../controller/review.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");
const checkRole = require("../middlewares/checkRole");

const {
  createReviewSchema,
  updateReviewSchema,
} = require("../schema/review.schema");

// CREATE REVIEW
router.post(
  "/",
  verifyToken(),
  validate(createReviewSchema),
  reviewController.create,
);

// GET PRODUCT REVIEWS
router.get("/product/:productId", reviewController.getByProduct);

// DELETE REVIEW (soft delete)
router.delete("/:id", verifyToken(), reviewController.remove);

module.exports = router;
