const knex = require("../database/knex");

// CREATE
exports.createBlog = async (data) => {
  const [blog] = await knex("blogs").insert(data).returning("*");

  return blog;
};

// GET ALL
exports.getBlogs = async () => {
  return knex("blogs")
    .where({ is_deleted: false })
    .orderBy("created_at", "desc");
};

// GET BY SLUG
exports.getBySlug = async (slug) => {
  return knex("blogs").where({ slug, is_deleted: false }).first();
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
