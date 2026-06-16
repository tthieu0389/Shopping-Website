const express = require("express");
const router = express.Router();

const favoriteController = require("../controller/favorite.controller");
const verifyToken = require("../middlewares/verifyToken");

// ADD FAVORITE
router.post("/", verifyToken, favoriteController.add);

// GET MY FAVORITES
router.get("/", verifyToken, favoriteController.get);

// DELETE FAVORITE (soft delete)
router.delete("/:id", verifyToken, favoriteController.remove);

module.exports = router;
