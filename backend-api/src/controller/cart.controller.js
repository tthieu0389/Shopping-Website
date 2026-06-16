const cartService = require("../services/cart.service");

// GET CART
exports.getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCartItems(req.user.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// ADD TO CART
exports.addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    const item = await cartService.addToCart(req.user.id, product_id, quantity);

    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
};

// UPDATE CART ITEM
exports.updateItem = async (req, res, next) => {
  try {
    const item = await cartService.updateItem(req.params.id, req.body.quantity);

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ data: item });
  } catch (err) {
    next(err);
  }
};

// REMOVE CART ITEM
exports.removeItem = async (req, res, next) => {
  try {
    const ok = await cartService.removeItem(req.params.id);

    if (!ok) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Item removed" });
  } catch (err) {
    next(err);
  }
};

// CLEAR CART
exports.clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.id);
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

exports.checkout = async (req, res, next) => {
  try {
    const order = await cartService.checkout(req.user.id, req.body);

    res.status(201).json({
      message: "Checkout successful",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
