const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");
const sanitizeHtml = require("sanitize-html");

// Whitelist thẻ/attribute cho phép trong nội dung blog (rich-text editor)
// đủ dùng cho bài viết thông thường (in đậm, nghiêng, list, link, ảnh, heading)
// nhưng chặn <script>, onload=, javascript: v.v. để tránh stored XSS.
const BLOG_SANITIZE_OPTIONS = {
  allowedTags: [
    "p",
    "b",
    "i",
    "em",
    "strong",
    "u",
    "s",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "a",
    "img",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    span: ["style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

const sanitizeBlogContent = (content) =>
  typeof content === "string"
    ? sanitizeHtml(content, BLOG_SANITIZE_OPTIONS)
    : content;

const generateSlug = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "") +
  "-" +
  Date.now();

// CREATE
exports.createBlog = async (data) => {
  const payload = { ...data };
  if (payload.content !== undefined) {
    payload.content = sanitizeBlogContent(payload.content);
  }
  if (!payload.slug && payload.title) {
    payload.slug = generateSlug(payload.title);
  }
  const [blog] = await knex("blogs").insert(payload).returning("*");

  return blog;
};

// GET ALL (có phân trang + tìm theo tiêu đề/slug)
exports.getBlogs = async ({ limit = 10, offset = 0, search } = {}) => {
  const kw = normalizeKeyword(search);

  const baseQuery = () => {
    const q = knex("blogs").where({ is_deleted: false });
    if (kw) {
      q.andWhere((qb) => {
        qb.where("title", "ilike", `%${kw}%`).orWhere(
          "slug",
          "ilike",
          `%${kw}%`,
        );
      });
    }
    return q;
  };

  const [{ count }] = await baseQuery().count("id as count");

  const data = await baseQuery()
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
  const payload = { ...data };
  if (payload.content !== undefined) {
    payload.content = sanitizeBlogContent(payload.content);
  }
  const [blog] = await knex("blogs")
    .where({ id })
    .update(payload)
    .returning("*");

  return blog;
};

// DELETE (soft)
exports.deleteBlog = async (id) => {
  return knex("blogs").where({ id }).update({ is_deleted: true });
};
