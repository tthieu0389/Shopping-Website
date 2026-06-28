const knex = require("../database/knex");

exports.createPaymentMethod = async (data) => {
  const [payment] = await knex("user_payment_methods")
    .insert(data)
    .returning("*");
  return payment;
};

exports.getPaymentsByUserId = async (userId) => {
  return await knex("user_payment_methods")
    .where({ user_id: userId, is_deleted: false })
    .select("*");
};

exports.updatePaymentMethod = async (id, userId, data) => {
  const [payment] = await knex("user_payment_methods")
    .where({ id, user_id: userId, is_deleted: false })
    .update(data)
    .returning("*");

  if (!payment) {
    const err = new Error(
      "Phương thức thanh toán không tồn tại hoặc không có quyền sửa",
    );
    err.statusCode = 404;
    throw err;
  }
  return payment;
};

exports.deletePaymentMethod = async (id, userId) => {
  const [payment] = await knex("user_payment_methods")
    .where({ id, user_id: userId, is_deleted: false })
    .update({ is_deleted: true })
    .returning("*");

  if (!payment) {
    const err = new Error(
      "Phương thức thanh toán không tồn tại hoặc không có quyền xóa",
    );
    err.statusCode = 404;
    throw err;
  }
  return payment;
};
