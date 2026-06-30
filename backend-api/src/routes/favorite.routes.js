const express = require("express");
const router = express.Router();

const favoriteController = require("../controller/favorite.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");
const { addFavoriteSchema } = require("../schema/favorite.schema");

// ADD FAVORITE
router.post(
  "/",
  verifyToken(),
  validate(addFavoriteSchema),
  favoriteController.add,
);

// GET MY FAVORITES
router.get("/", verifyToken(), favoriteController.get);

// DELETE FAVORITE
router.delete("/:productId", verifyToken(), favoriteController.remove);

module.exports = router;
