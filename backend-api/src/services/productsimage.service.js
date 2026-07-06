const knex = require("../database/knex");

exports.createManyProductImages = async (images) => {
  if (!images || images.length === 0) return [];

  return await knex.transaction(async (trx) => {
    const product_id = images[0].product_id;

    // Nếu trong danh sách gửi lên không có ảnh nào được chỉ định là thumbnail
    const hasThumbnailInBatch = images.some((img) => img.is_thumbnail);

    let finalImages = images;

    if (!hasThumbnailInBatch) {
      // Kiểm tra product đã có thumbnail từ trước chưa
      const existingThumbnail = await trx("product_images")
        .where({ product_id, is_thumbnail: true })
        .first();

      // Nếu chưa có thumbnail nào: lấy ảnh đầu tiên trong danh sách làm thumbnail
      if (!existingThumbnail) {
        finalImages = images.map((img, index) => ({
          ...img,
          is_thumbnail: index === 0,
        }));
      }
    }

    return await trx("product_images").insert(finalImages).returning("*");
  });
};

exports.getImagesByProductId = async (product_id) => {
  return await knex("product_images")
    .where({ product_id })
    .select("*")
    .orderBy("id", "asc");
};

exports.deleteImage = async (id) => {
  return await knex.transaction(async (trx) => {
    const image = await trx("product_images").where({ id }).first();
    if (!image) return null;

    await trx("product_images").where({ id }).del();

    let newThumbnail = null;

    // Nếu ảnh vừa xóa là ảnh thumbnail: tự động set ảnh còn lại sớm nhất làm thumbnail mới
    // (nếu ảnh bị xóa là ảnh đầu tiên thì ảnh còn lại sớm nhất chính là ảnh thứ 2 trước đó)
    if (image.is_thumbnail) {
      const nextImage = await trx("product_images")
        .where({ product_id: image.product_id })
        .orderBy("id", "asc")
        .first();

      if (nextImage) {
        [newThumbnail] = await trx("product_images")
          .where({ id: nextImage.id })
          .update({ is_thumbnail: true })
          .returning("*");
      }
    }

    return { deletedImage: image, newThumbnail };
  });
};

exports.setThumbnail = async (id, product_id) => {
  return await knex.transaction(async (trx) => {
    // Reset tất cả thumbnail của product
    await trx("product_images")
      .where({ product_id })
      .update({ is_thumbnail: false });

    // Set thumbnail mới
    const [img] = await trx("product_images")
      .where({ id })
      .update({ is_thumbnail: true })
      .returning("*");

    return img;
  });
};
