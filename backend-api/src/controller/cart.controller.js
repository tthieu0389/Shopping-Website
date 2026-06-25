const cartService = require("../services/cart.service");

// Lấy giỏ hàng
exports.getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCartItems(req.user.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Thêm vào giỏ
exports.addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;
    const item = await cartService.addToCart(req.user.id, product_id, quantity);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
};

// Cập nhật số lượng
exports.updateItem = async (req, res, next) => {
  try {
    const item = await cartService.updateItem(req.params.id, req.body.quantity);
    if (!item) return res.status(404).json({ message: "Cart item not found" });
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
};

// Xóa 1 món
exports.removeItem = async (req, res, next) => {
  try {
    const ok = await cartService.removeItem(req.params.id);
    if (!ok) return res.status(404).json({ message: "Cart item not found" });
    res.json({ message: "Item removed" });
  } catch (err) {
    next(err);
  }
};

// Xóa sạch giỏ
exports.clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.id);
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

// Preview giỏ hàng
exports.previewCart = async (req, res, next) => {
  try {
    const data = await cartService.previewCart(req.user.id, req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Checkout
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

// Toggle chọn/bỏ chọn
exports.toggleSelectItem = async (req, res, next) => {
  try {
    const item = await cartService.toggleSelectItem(
      req.params.id,
      req.body.is_selected,
    );
    if (!item) return res.status(404).json({ message: "Cart item not found" });
    res.json({ message: "Cập nhật thành công", data: item });
  } catch (err) {
    next(err);
  }
};
