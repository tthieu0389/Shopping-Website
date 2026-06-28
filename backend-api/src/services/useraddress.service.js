const knex = require("../database/knex");

exports.createAddress = async (data) => {
  const [address] = await knex("user_addresses").insert(data).returning("*");

  return address;
};

exports.getAddressesByUserId = async (userId) => {
  return await knex("user_addresses")
    .where({ user_id: userId, is_deleted: false })
    .select("*");
};

exports.updateAddress = async (id, data) => {
  const [address] = await knex("user_addresses")
    .where("id", id)
    .update(data)
    .returning("*");

  return address;
};

exports.deleteAddress = async (id) => {
  const [address] = await knex("user_addresses")
    .where({ id })
    .update({ is_deleted: true })
    .returning("*");

  return address;
};

exports.setDefaultAddress = async (userId, addressId) => {
  return await knex.transaction(async (trx) => {
    // Reset tất cả địa chỉ chưa xóa của user về non-default
    await trx("user_addresses")
      .where({ user_id: userId, is_deleted: false })
      .update({ is_default: false });

    // Set địa chỉ được chọn làm default
    const [address] = await trx("user_addresses")
      .where({ id: addressId, user_id: userId })
      .update({ is_default: true })
      .returning("*");

    return address;
  });
};
