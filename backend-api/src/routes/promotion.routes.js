const express = require("express");
const router = express.Router();

const controller = require("../controller/promotion.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");
const {
  createPromotionSchema,
  updatePromotionSchema,
} = require("../schema/promotion.schema");

router.get("/discounted-products", controller.getDiscountedProducts);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.post(
  "/",
  verifyToken(),
  checkRole("admin"),
  validate(createPromotionSchema),
  controller.create,
);
router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updatePromotionSchema),
  controller.update,
);
router.delete("/:id", verifyToken(), checkRole("admin"), controller.remove);

module.exports = router;
