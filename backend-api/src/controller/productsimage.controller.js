const productImageService = require("../services/productsimage.service");

// UPLOAD 1 OR MANY IMAGES
exports.uploadImages = async (req, res, next) => {
  try {
    const product_id = req.body.product_id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No images uploaded",
      });
    }

    const images = req.files.map((file) => ({
      product_id: Number(product_id),
      image_url: `/uploads/${file.filename}`,
      is_thumbnail: false, // default
    }));

    const result = await productImageService.createManyProductImages(images);

    res.status(201).json({
      message: "Images uploaded successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET BY PRODUCT
exports.getByProductId = async (req, res, next) => {
  try {
    const images = await productImageService.getImagesByProductId(
      req.params.productId,
    );

    res.json({ data: images });
  } catch (err) {
    next(err);
  }
};

// DELETE IMAGE
exports.deleteImage = async (req, res, next) => {
  try {
    await productImageService.deleteImage(req.params.id);

    res.json({ message: "Image deleted" });
  } catch (err) {
    next(err);
  }
};

// SET THUMBNAIL
exports.setThumbnail = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const { id } = req.params;

    const result = await productImageService.setThumbnail(id, product_id);

    res.json({
      message: "Thumbnail updated",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
