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

exports.setDefaultAddress = async (userId, addressId) => {
  return await knex.transaction(async (trx) => {
    await trx("user_addresses")
      .where({ user_id: userId, is_deleted: false })
      .update({ is_default: false });

    const [address] = await trx("user_addresses")
      .where({ id: addressId, user_id: userId })
      .update({ is_default: true })
      .returning("*");

    return address;
  });
};
