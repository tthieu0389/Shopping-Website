const productService = require("../services/products.service");

const convertStringBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      is_available:
        req.body.is_available !== undefined
          ? convertStringBoolean(req.body.is_available)
          : true,
    };
    const product = await productService.createProduct(data);
    res.status(201).json({
      message: "Product created",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// Danh sách sản phẩm cho user thường (public)
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    const filters = { ...req.query };

    const result = await productService.getAllProducts({
      limit,
      offset,
      filters,
    });

    res.json({
      data: result.data,
      total: result.total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

// Danh sách sản phẩm cho admin/staff — thấy cả active lẫn inactive
exports.getAllProductsForAdmin = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    const filters = { ...req.query };

    const result = await productService.getAllProductsForAdmin({
      limit,
      offset,
      filters,
    });

    res.json({
      data: result.data,
      total: result.total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.is_available !== undefined) {
      data.is_available = convertStringBoolean(data.is_available);
    }
    const product = await productService.updateProduct(req.params.id, data);
    res.json({
      message: "Product updated",
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    if (result && result.success) {
      return res.json({
        message: result.message,
        data: result.data || { deleted: result.deleted },
      });
    }
    res.json({
      message: "Product deleted",
    });
  } catch (err) {
    if (err.message === "Product not found") {
      return res.status(404).json({ message: "Product not found" });
    }
    if (err.message.includes("Cannot delete product")) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

// Get product by ID or Slug
exports.getProductByIdOrSlug = async (req, res, next) => {
  try {
    const product = await productService.getProductByIdOrSlug(
      req.params.idOrSlug,
    );
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    res.json({
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// Get related products
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const products = await productService.getRelatedProducts(req.params.id);
    res.json({
      data: products,
    });
  } catch (err) {
    next(err);
  }
};
