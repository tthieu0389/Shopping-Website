const userPaymentService = require("../services/userpayment.service");

// Create a new payment method
exports.createPaymentMethod = async (req, res, next) => {
  try {
    // Keep your original body data and append userId from token if not provided
    const data = {
      ...req.body,
      user_id: req.body.user_id || req.user.id,
    };

    const payment = await userPaymentService.createPaymentMethod(data);
    res.status(201).json({ message: "Payment method created", data: payment });
  } catch (err) {
    next(err);
  }
};

// Get all payment methods by userId
exports.getPaymentsByUserId = async (req, res, next) => {
  try {
    // Fallback to token userId if route param is missing
    const userId = req.params.userId || req.user.id;

    const payments = await userPaymentService.getPaymentsByUserId(userId);
    res.json({ data: payments });
  } catch (err) {
    next(err);
  }
};

// Update payment method
exports.updatePaymentMethod = async (req, res, next) => {
  try {
    const payment = await userPaymentService.updatePaymentMethod(
      req.params.id,
      req.body,
    );

    res.json({ message: "Payment updated", data: payment });
  } catch (err) {
    next(err);
  }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res, next) => {
  try {
    await userPaymentService.deletePaymentMethod(req.params.id);
    res.json({ message: "Payment deleted" });
  } catch (err) {
    next(err);
  }
};
