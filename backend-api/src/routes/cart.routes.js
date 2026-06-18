const express = require("express");
const router = express.Router();

const controller = require("../controller/cart.controller");
const verifyToken = require("../middlewares/verifyToken");
const validate = require("../middlewares/validate");

const {
  addToCartSchema,
  updateCartItemSchema,
  checkoutSchema,
} = require("../schema/cart.schema");

// GET CART
router.get("/", verifyToken(), controller.getCart);

// ADD TO CART
router.post("/", verifyToken(), validate(addToCartSchema), controller.addToCart);

// UPDATE ITEM
router.put(
  "/:id",
  verifyToken(),
  validate(updateCartItemSchema),
  controller.updateItem,
);

// CLEAR CART (đặt trước :id để tránh conflict)
router.delete("/clear", verifyToken(), controller.clearCart);

// DELETE ITEM
router.delete("/:id", verifyToken(), controller.removeItem);

// CHECKOUT
router.post(
  "/checkout",
  verifyToken(),
  validate(checkoutSchema),
  controller.checkout,
);

module.exports = router;
