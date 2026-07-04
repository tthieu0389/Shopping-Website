const knex = require("../database/knex");

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

exports.getAllCategories = async ({ keyword } = {}) => {
  const query = knex("categories").where({ is_deleted: false }).select();
  if (keyword) {
    query.andWhere("name", "ilike", `%${keyword}%`);
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

  await knex("categories").where({ id }).update({ is_deleted: true });

  return category;
};
