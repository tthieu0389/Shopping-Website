const productDetailService = require("../services/productsdetail.service");

exports.getByProductId = async (req, res, next) => {
  try {
    const data = await productDetailService.getProductDetailsByProductId(
      req.params.productId,
    );

    res.json({
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const detail = await productDetailService.createProductDetail(req.body);

    res.status(201).json({
      message: "Product detail created",
      data: detail,
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const detail = await productDetailService.updateProductDetail(
      req.params.id,
      req.body,
    );

    res.json({
      message: "Product detail updated",
      data: detail,
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await productDetailService.deleteProductDetail(req.params.id);

    res.json({
      message: "Product detail deleted",
    });
  } catch (err) {
    next(err);
  }
};
