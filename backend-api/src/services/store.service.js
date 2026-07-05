const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

// Tạo cửa hàng mới
exports.createStore = async (data) => {
  const [store] = await knex("stores").insert(data).returning("*");
  return store;
};

// Lấy danh sách cửa hàng chưa bị xóa (có thể tìm theo tên/tỉnh/địa chỉ)
exports.getAllStores = async ({ search } = {}) => {
  const query = knex("stores").where({ is_deleted: false });

  const kw = normalizeKeyword(search);
  if (kw) {
    query.andWhere((qb) => {
      qb.where("name", "ilike", `%${kw}%`)
        .orWhere("province", "ilike", `%${kw}%`)
        .orWhere("address", "ilike", `%${kw}%`);
    });
  }

  return await query.orderBy("id", "desc");
};

// Cập nhật thông tin cửa hàng
exports.updateStore = async (id, data) => {
  // Phải check thêm is_deleted: false để tránh tình trạng update nhầm hàng đã xóa
  const [store] = await knex("stores")
    .where({ id, is_deleted: false })
    .update(data)
    .returning("*");

  if (!store) {
    const err = new Error("Cửa hàng không tồn tại hoặc đã bị xóa");
    err.statusCode = 404;
    throw err;
  }

  return store;
};

// Xóa mềm cửa hàng
exports.deleteStore = async (id) => {
  // Check xem cửa hàng có tồn tại để xóa không
  const currentStore = await knex("stores")
    .where({ id, is_deleted: false })
    .first();
  if (!currentStore) {
    const err = new Error("Cửa hàng không tồn tại hoặc đã bị xóa trước đó");
    err.statusCode = 404;
    throw err;
  }

  return await knex("stores").where({ id }).update({ is_deleted: true });
};
