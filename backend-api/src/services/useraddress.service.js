const knex = require("../database/knex");

exports.createAddress = async (data) => {
  return await knex.transaction(async (trx) => {
    // Nếu FE không set is_default, kiểm tra xem đây có phải địa chỉ đầu tiên không
    if (data.is_default === undefined || data.is_default === null) {
      const existingCount = await trx("user_addresses")
        .where({ user_id: data.user_id, is_deleted: false })
        .count("id as count")
        .first();

      // Nếu chưa có địa chỉ nào -> địa chỉ này tự động là mặc định
      data.is_default = Number(existingCount.count) === 0;
    }

    // Nếu FE chủ động set is_default = true, unset các địa chỉ default khác trước
    if (data.is_default === true) {
      await trx("user_addresses")
        .where({ user_id: data.user_id, is_deleted: false })
        .update({ is_default: false });
    }

    const [address] = await trx("user_addresses").insert(data).returning("*");

    return address;
  });
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
  return await knex.transaction(async (trx) => {
    const [address] = await trx("user_addresses")
      .where({ id, user_id: userId, is_deleted: false })
      .update({ is_deleted: true })
      .returning("*");

    if (!address) {
      const err = new Error("Địa chỉ không tồn tại hoặc không có quyền xóa");
      err.statusCode = 404;
      throw err;
    }

    // Nếu địa chỉ vừa xóa là mặc định -> tự động gán default cho địa chỉ còn lại đầu tiên
    if (address.is_default) {
      const nextDefault = await trx("user_addresses")
        .where({ user_id: userId, is_deleted: false })
        .orderBy("id", "asc")
        .first();

      if (nextDefault) {
        await trx("user_addresses")
          .where({ id: nextDefault.id })
          .update({ is_default: true });
      }
    }

    return address;
  });
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
