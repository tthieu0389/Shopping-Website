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

exports.updateAddress = async (id, userId, data) => {
  const [address] = await knex("user_addresses")
    .where({ id, user_id: userId, is_deleted: false })
    .update(data)
    .returning("*");

  if (!address) {
    const err = new Error("Địa chỉ không tồn tại hoặc không có quyền sửa");
    err.statusCode = 404;
    throw err;
  }
  return address;
};

exports.deleteAddress = async (id, userId) => {
  const [address] = await knex("user_addresses")
    .where({ id, user_id: userId, is_deleted: false })
    .update({ is_deleted: true })
    .returning("*");

  if (!address) {
    const err = new Error("Địa chỉ không tồn tại hoặc không có quyền xóa");
    err.statusCode = 404;
    throw err;
  }
  return address;
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
