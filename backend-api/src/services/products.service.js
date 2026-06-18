const knex = require("../database/knex");

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "") +
  "-" +
  Date.now();

exports.createProduct = async (data) => {
  if (!data.slug && data.name) {
    data.slug = generateSlug(data.name);
  }
  if (data.attributes && typeof data.attributes === "object") {
    data.attributes = JSON.stringify(data.attributes);
  }
  const [product] = await knex("products").insert(data).returning("*");
  return product;
};

exports.getAllProducts = async ({ limit, offset, filters = {} }) => {
  let query = knex("products").where("is_deleted", false).select("*");
  let countQuery = knex("products").where("is_deleted", false);

  // Nhận từ khóa từ cả q hoặc search
  const keyword = filters.q || filters.search;

  // Bóc tách các trường chính
  const {
    category_id,
    product_type,
    brand,
    model,
    is_available,
    featured,
    ...dynamicFilters
  } = filters;

  // Tìm kiếm theo từ khóa
  if (keyword) {
    const searchBlock = (builder) => {
      builder
        .where("name", "like", `%${keyword}%`)
        .orWhere("slug", "like", `%${keyword}%`);
    };
    query = query.where(searchBlock);
    countQuery = countQuery.where(searchBlock);
  }

  // Lọc theo danh mục
  if (category_id) {
    query = query.where("category_id", category_id);
    countQuery = countQuery.where("category_id", category_id);
  }

  // Lọc theo phân loại lớn
  if (product_type) {
    query = query.where("product_type", product_type);
    countQuery = countQuery.where("product_type", product_type);
  }

  // Lọc theo thương hiệu (Dùng LIKE tiêu chuẩn)
  if (brand) {
    query = query.where("brand", "like", brand);
    countQuery = countQuery.where("brand", "like", brand);
  }

  // Lọc theo dòng thiết bị
  if (model) {
    query = query.where("model", "like", model);
    countQuery = countQuery.where("model", "like", model);
  }

  // Lọc theo trạng thái kinh doanh
  if (is_available !== undefined && is_available !== "") {
    const isAvail = is_available === "true" || is_available === true ? 1 : 0;

    // Knex sẽ tự dịch giá trị 1/0 thành đúng kiểu Boolean thích hợp cho từng DB
    query = query.where("is_available", isAvail);
    countQuery = countQuery.where("is_available", isAvail);
  }

  // Lọc theo sản phẩm nổi bật
  if (featured !== undefined && featured !== "") {
    const isFeatured = featured === "true" || featured === true ? 1 : 0;
    query = query.where("is_featured", isFeatured);
    countQuery = countQuery.where("is_featured", isFeatured);
  }

  // Lọc theo các trường động trong attributes (JSON)
  Object.keys(dynamicFilters).forEach((key) => {
    const val = dynamicFilters[key];
    if (val !== undefined && val !== "") {
      // Tìm kiếm cặp "key":"value" nằm trong chuỗi văn bản JSON của trường attributes
      const lookFor = `"${key}":"${val}"`;

      query = query.where("attributes", "like", `%${lookFor}%`);
      countQuery = countQuery.where("attributes", "like", `%${lookFor}%`);
    }
  });

  // Tính toán phân trang và trả kết quả
  const [totalRow] = await countQuery.count("* as count");
  const total = Number(totalRow.count);

  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total };
};

exports.getProductByIdOrSlug = async (idOrSlug) => {
  if (!idOrSlug) return null;

  if (!isNaN(idOrSlug)) {
    return await knex("products")
      .where({ id: Number(idOrSlug), is_deleted: false })
      .first();
  }

  return await knex("products")
    .where({ slug: idOrSlug, is_deleted: false })
    .first();
};

exports.getRelatedProducts = async (id) => {
  if (!id || isNaN(id)) return [];

  const product = await knex("products")
    .where({ id, is_deleted: false })
    .first();
  if (!product) return [];

  return await knex("products")
    .where({ category_id: product.category_id, is_deleted: false })
    .whereNot("id", id)
    .limit(8);
};

exports.updateProduct = async (id, data) => {
  if (!id || isNaN(id)) {
    const err = new Error("Invalid product ID");
    err.statusCode = 400;
    throw err;
  }
  if (data.attributes && typeof data.attributes === "object") {
    data.attributes = JSON.stringify(data.attributes);
  }
  const [product] = await knex("products")
    .where("id", id)
    .update(data)
    .returning("*");
  return product;
};

exports.deleteProduct = async (id) => {
  const product = await knex("products")
    .where({ id, is_deleted: false })
    .first();

  if (!product) throw new Error("Product not found");

  const [deletedProduct] = await knex("products")
    .where("id", id)
    .update({ is_deleted: true, deleted_at: knex.fn.now() })
    .returning("*");

  return {
    success: true,
    message: "Product deleted successfully",
    data: deletedProduct,
  };
};
