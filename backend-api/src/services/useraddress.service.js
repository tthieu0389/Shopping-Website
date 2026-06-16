const knex = require("../database/knex");

exports.createAddress = async (data) => {
  const [address] = await knex("user_addresses").insert(data).returning("*");

  return address;
};

exports.getAddressesByUserId = async (userId) => {
  return await knex("user_addresses").where("user_id", userId).select("*");
};

exports.updateAddress = async (id, data) => {
  const [address] = await knex("user_addresses")
    .where("id", id)
    .update(data)
    .returning("*");

  return address;
};

exports.deleteAddress = async (id) => {
  return await knex("user_addresses").where("id", id).del();
};
