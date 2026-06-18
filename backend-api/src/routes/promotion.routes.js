const express = require("express");
const router = express.Router();

const controller = require("../controller/promotion.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");

router.get("/", verifyToken(), controller.getAll);
router.get("/:id", verifyToken(), controller.getById);

router.post("/", verifyToken(), checkRole("admin"), controller.create);
router.put("/:id", verifyToken(), checkRole("admin"), controller.update);
router.delete("/:id", verifyToken(), checkRole("admin"), controller.remove);

module.exports = router;
