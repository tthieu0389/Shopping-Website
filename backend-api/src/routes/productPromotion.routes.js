const express = require("express");
const router = express.Router();

const controller = require("../controller/productPromotion.controller");
const validate = require("../middlewares/validate");

const {
  createProductPromotionSchema,
} = require("../schema/productPromotion.schema");

router.get("/", controller.getAll);

router.post("/", validate(createProductPromotionSchema), controller.add);

router.delete("/:id", controller.remove);

module.exports = router;
