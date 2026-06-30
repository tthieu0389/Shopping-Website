const knex = require("../database/knex");

// CREATE
exports.createBlog = async (data) => {
  const [blog] = await knex("blogs").insert(data).returning("*");

  return blog;
};

// GET ALL (có phân trang)
exports.getBlogs = async ({ limit = 10, offset = 0 } = {}) => {
  const [{ count }] = await knex("blogs")
    .where({ is_deleted: false })
    .count("id as count");

  const data = await knex("blogs")
    .where({ is_deleted: false })
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total: Number(count) };
};

// GET BY SLUG
exports.getBySlug = async (slug) => {
  return knex("blogs").where({ slug, is_deleted: false }).first();
};

// GET BY ID
exports.getBlogById = async (id) => {
  return knex("blogs").where({ id, is_deleted: false }).first();
};

// UPDATE
exports.updateBlog = async (id, data) => {
  const [blog] = await knex("blogs").where({ id }).update(data).returning("*");

  return blog;
};

// DELETE (soft)
exports.deleteBlog = async (id) => {
  return knex("blogs").where({ id }).update({ is_deleted: true });
};
