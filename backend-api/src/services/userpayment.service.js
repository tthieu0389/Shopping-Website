const knex = require("../database/knex");

exports.createPaymentMethod = async (data) => {
  const [payment] = await knex("user_payment_methods")
    .insert(data)
    .returning("*");

  return payment;
};

exports.getPaymentsByUserId = async (userId) => {
  return await knex("user_payment_methods")
    .where("user_id", userId)
    .select("*");
};

exports.updatePaymentMethod = async (id, data) => {
  const [payment] = await knex("user_payment_methods")
    .where("id", id)
    .update(data)
    .returning("*");

  return payment;
};

exports.deletePaymentMethod = async (id) => {
  return await knex("user_payment_methods").where("id", id).del();
};
