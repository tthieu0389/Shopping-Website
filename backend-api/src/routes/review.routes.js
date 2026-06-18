const express = require("express");
const router = express.Router();

const reviewController = require("../controller/review.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");

const { createReviewSchema } = require("../schema/review.schema");

// Get reviews by query
router.get("/", reviewController.getByProduct);

// Get reviews by param
router.get("/product/:productId", reviewController.getByProduct);

// Create review
router.post(
  "/",
  verifyToken(),
  validate(createReviewSchema),
  reviewController.create,
);

// Delete review
router.delete("/:id", verifyToken(), reviewController.remove);

module.exports = router;
