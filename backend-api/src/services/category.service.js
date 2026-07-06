const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

exports.getAllCategories = async ({ search } = {}) => {
  const query = knex("categories").where({ is_deleted: false }).select();
  const kw = normalizeKeyword(search);
  if (kw) {
    query.andWhere("name", "ilike", `%${kw}%`);
  }
  return await query;
};

exports.createCategory = async (data) => {
  const slug = data.slug || generateSlug(data.name);
  const [category] = await knex("categories")
    .insert({ ...data, slug, is_deleted: false })
    .returning("*");
  return category;
};

exports.updateCategory = async (id, data) => {
  if (data.name && !data.slug) {
    data.slug = generateSlug(data.name);
  }

  const [updated] = await knex("categories")
    .where({ id, is_deleted: false })
    .update(data)
    .returning("*");

  if (!updated) {
    const err = new Error("Category not found or already deleted");
    err.statusCode = 404;
    throw err;
  }

  return updated;
};

exports.deleteCategory = async (id) => {
  const category = await knex("categories")
    .where({ id, is_deleted: false })
    .first();

  if (!category) {
    const err = new Error("Category not found or already deleted");
    err.statusCode = 404;
    throw err;
  }

  // Chặn xoá category nếu còn sản phẩm (chưa bị xoá) đang gán vào category này
  const [{ count }] = await knex("products")
    .where({ category_id: id, is_deleted: false })
    .count("id as count");

  if (Number(count) > 0) {
    const err = new Error(
      `Không thể xoá danh mục này vì còn ${count} sản phẩm đang thuộc danh mục. Vui lòng chuyển sản phẩm sang danh mục khác trước khi xoá.`,
    );
    err.statusCode = 409;
    throw err;
  }

  await knex("categories").where({ id }).update({ is_deleted: true });

  return category;
};
