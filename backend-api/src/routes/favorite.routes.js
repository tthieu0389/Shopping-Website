const express = require("express");
const router = express.Router();

const favoriteController = require("../controller/favorite.controller");
const verifyToken = require("../middlewares/verifyToken");

// ADD FAVORITE
router.post("/", verifyToken(), favoriteController.add);

// GET MY FAVORITES
router.get("/", verifyToken(), favoriteController.get);

// DELETE FAVORITE
router.delete("/:productId", verifyToken(), favoriteController.remove);

module.exports = router;
