const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const blogs = await knex("blogs").select("id");

  if (blogs.length === 0) {
    console.log("Không có blog để seed blog_images!");
    return;
  }

  // Mỗi blog có 2-4 ảnh nội dung (đã gắn blog_id, khớp với flow attach sau khi blog được lưu)
  const data = blogs.flatMap((blog) => {
    const count = faker.number.int({ min: 2, max: 4 });
    return Array.from({ length: count }, (_, i) => ({
      blog_id: blog.id,
      image_url: `https://picsum.photos/seed/blog_${blog.id}_${i}/800/450`,
      alt_text: faker.lorem.words(4),
      sort_order: i,
    }));
  });

  await knex("blog_images").insert(data);
};
