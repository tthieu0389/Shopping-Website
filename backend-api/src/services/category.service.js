const knex = require("../database/knex");

exports.getAllCategories = async () => {
  return await knex("categories")
    .where({ is_deleted: false }) // chỉ lấy những danh mục chưa bị xoá
    .select();
};

exports.createCategory = async (data) => {
  const [category] = await knex("categories")
    .insert({ ...data, is_deleted: false }) // đảm bảo mới tạo sẽ có is_deleted = false
    .returning("*");
  return category;
};

exports.updateCategory = async (id, data) => {
  const [updated] = await knex("categories")
    .where({ id, is_deleted: false }) // chỉ update nếu chưa bị xoá mềm
    .update(data)
    .returning("*");

  if (!updated) throw new Error("Category not found or already deleted");

  return updated;
};

exports.deleteCategory = async (id) => {
  const category = await knex("categories")
    .where({ id, is_deleted: false })
    .first();

  if (!category) throw new Error("Category not found or already deleted");
  await knex("categories").where({ id }).update({ is_deleted: true });

  return category;
};
