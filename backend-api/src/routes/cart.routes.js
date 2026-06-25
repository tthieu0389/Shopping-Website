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
router.post(
  "/items",
  verifyToken(),
  validate(addToCartSchema),
  controller.addToCart,
);

// UPDATE ITEM
router.put(
  "/items/:id",
  verifyToken(),
  validate(updateCartItemSchema),
  controller.updateItem,
);

// CLEAR CART - DELETE /cart (Đặt trước tuyến :id của delete item để tránh conflict)
router.delete("/clear", verifyToken(), controller.clearCart);

// DELETE ITEM
router.delete("/items/:id", verifyToken(), controller.removeItem);

// PREVIEW CART (Chỉ tính toán, không lưu đơn)
router.post("/preview", verifyToken(), controller.previewCart);

// CHECKOUT
router.post(
  "/checkout",
  verifyToken(),
  validate(checkoutSchema),
  controller.checkout,
);

// Dùng PATCH vì đây là cập nhật một phần thuộc tính
router.patch("/toggle-select/:id", verifyToken(), controller.toggleSelectItem);

module.exports = router;
