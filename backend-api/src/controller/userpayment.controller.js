const userPaymentService = require("../services/userpayment.service");

exports.createPaymentMethod = async (req, res, next) => {
  try {
    const payment = await userPaymentService.createPaymentMethod(req.body);
    res.status(201).json({ message: "Payment method created", data: payment });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentsByUserId = async (req, res, next) => {
  try {
    const payments = await userPaymentService.getPaymentsByUserId(
      req.params.userId,
    );
    res.json({ data: payments });
  } catch (err) {
    next(err);
  }
};

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

exports.deletePaymentMethod = async (req, res, next) => {
  try {
    await userPaymentService.deletePaymentMethod(req.params.id);
    res.json({ message: "Payment deleted" });
  } catch (err) {
    next(err);
  }
};
