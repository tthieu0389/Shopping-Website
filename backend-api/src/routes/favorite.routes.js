const express = require("express");
const router = express.Router();

const favoriteController = require("../controller/favorite.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");
const { addFavoriteSchema } = require("../schema/favorite.schema");
const pagination = require("../middlewares/pagination");

// ADD FAVORITE
router.post(
  "/",
  verifyToken(),
  validate(addFavoriteSchema),
  favoriteController.add,
);

// GET MY FAVORITES
router.get("/", verifyToken(), pagination(), favoriteController.get);

// DELETE FAVORITE
router.delete("/:productId", verifyToken(), favoriteController.remove);

module.exports = router;
