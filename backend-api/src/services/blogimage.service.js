const knex = require("../database/knex");

// CREATE (1 ảnh / lần upload, khớp với flow paste ảnh vào content)
exports.createBlogImage = async ({ blog_id, image_url, alt_text }) => {
  const [img] = await knex("blog_images")
    .insert({
      blog_id: blog_id ?? null,
      image_url,
      alt_text: alt_text ?? null,
    })
    .returning("*");

  return img;
};

// GET BY BLOG
exports.getImagesByBlogId = async (blog_id) => {
  return knex("blog_images")
    .where({ blog_id })
    .select("*")
    .orderBy("sort_order", "asc");
};

// GẮN ẢNH MỒ CÔI (blog_id null lúc upload) VÀO BLOG SAU KHI BLOG ĐƯỢC LƯU
exports.attachToBlog = async (id, blog_id) => {
  const [img] = await knex("blog_images")
    .where({ id })
    .update({ blog_id })
    .returning("*");

  return img;
};

// DELETE
exports.deleteImage = async (id) => {
  return knex("blog_images").where({ id }).del();
};

exports.pruneUnusedImages = async (blog_id, content) => {
  const images = await knex("blog_images").where({ blog_id }).select("*");

  const unused = images.filter((img) => !content.includes(img.image_url));

  if (unused.length === 0) return [];

  const ids = unused.map((img) => img.id);
  await knex("blog_images").whereIn("id", ids).del();

  return unused;
};
