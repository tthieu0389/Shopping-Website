const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

// Postgres unique_violation code, dùng làm lưới an toàn cho race condition
// (2 request tạo cùng tên/slug gần như đồng thời) - lúc đó check trước khi
// insert có thể không kịp bắt, DB constraint sẽ chặn.
const isUniqueViolation = (err) => err && err.code === "23505";

const throwDuplicateError = () => {
  const err = new Error("Tên hoặc slug danh mục đã tồn tại");
  err.statusCode = 409;
  throw err;
};

// Kiểm tra trùng tên/slug với các category đang active (is_deleted = false)
// excludeId: dùng khi update, để không tự đụng chính nó
const checkDuplicate = async (name, slug, excludeId = null) => {
  const query = knex("categories")
    .where({ is_deleted: false })
    .andWhere((qb) => {
      qb.whereRaw("LOWER(name) = LOWER(?)", [name]).orWhere("slug", slug);
    });

  if (excludeId) {
    query.andWhereNot("id", excludeId);
  }

  const existing = await query.first();
  if (existing) {
    throwDuplicateError();
  }
};

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

  await checkDuplicate(data.name, slug);

  try {
    const [category] = await knex("categories")
      .insert({ ...data, slug, is_deleted: false })
      .returning("*");
    return category;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throwDuplicateError();
    }
    throw err;
  }
};

exports.updateCategory = async (id, data) => {
  if (data.name && !data.slug) {
    data.slug = generateSlug(data.name);
  }

  // Chỉ cần check trùng khi thực sự đổi tên hoặc slug
  if (data.name || data.slug) {
    const current = await knex("categories").where({ id }).first();

    if (!current) {
      const err = new Error("Category not found or already deleted");
      err.statusCode = 404;
      throw err;
    }

    const nextName = data.name ?? current.name;
    const nextSlug = data.slug ?? current.slug;
    await checkDuplicate(nextName, nextSlug, id);
  }

  let updated;
  try {
    [updated] = await knex("categories")
      .where({ id, is_deleted: false })
      .update(data)
      .returning("*");
  } catch (err) {
    if (isUniqueViolation(err)) {
      throwDuplicateError();
    }
    throw err;
  }

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
