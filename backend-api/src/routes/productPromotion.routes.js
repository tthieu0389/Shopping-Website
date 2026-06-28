const express = require("express");
const router = express.Router();

const controller = require("../controller/productPromotion.controller");
const validate = require("../middlewares/validate");
// FIX #12: Import middleware auth — các route này trước đó hoàn toàn public
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");

const {
  createProductPromotionSchema,
} = require("../schema/productPromotion.schema");

// GET
router.get("/", controller.getAll);

// POST và DELETE yêu cầu đăng nhập + quyền admin
router.post(
  "/",
  verifyToken(),
  checkRole("admin"),
  validate(createProductPromotionSchema),
  controller.add,
);

router.delete("/:id", verifyToken(), checkRole("admin"), controller.remove);

module.exports = router;
