const userPaymentService = require("../services/userpayment.service");

exports.createPaymentMethod = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      user_id: req.user.id,
    };
    const payment = await userPaymentService.createPaymentMethod(data);
    res.status(201).json({ message: "Payment method created", data: payment });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentsByUserId = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const payments = await userPaymentService.getPaymentsByUserId(userId);
    res.json({ data: payments });
  } catch (err) {
    next(err);
  }
};

exports.updatePaymentMethod = async (req, res, next) => {
  try {
    const payment = await userPaymentService.updatePaymentMethod(
      req.params.id,
      req.user.id, // ← ownership check
      req.body,
    );
    res.json({ message: "Payment updated", data: payment });
  } catch (err) {
    next(err);
  }
};

exports.deletePaymentMethod = async (req, res, next) => {
  try {
    await userPaymentService.deletePaymentMethod(req.params.id, req.user.id);
    res.json({ message: "Payment deleted" });
  } catch (err) {
    next(err);
  }
};
