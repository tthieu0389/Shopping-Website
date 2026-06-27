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

  const {
    q,
    search,
    limit: _l,
    page: _p,
    offset: _o,
    category_id,
    product_type,
    brand,
    model,
    is_available,
    featured,
    sort,
    price_min,
    price_max,
    ...dynamicFilters
  } = filters;

  const keyword = q || search;

  if (keyword) {
    const searchBlock = (builder) => {
      builder
        .where("name", "like", `%${keyword}%`)
        .orWhere("slug", "like", `%${keyword}%`);
    };
    query = query.where(searchBlock);
    countQuery = countQuery.where(searchBlock);
  }

  if (category_id) {
    query = query.where("category_id", category_id);
    countQuery = countQuery.where("category_id", category_id);
  }

  if (product_type) {
    query = query.where("product_type", product_type);
    countQuery = countQuery.where("product_type", product_type);
  }

  if (brand) {
    query = query.where("brand", "like", `%${brand}%`);
    countQuery = countQuery.where("brand", "like", `%${brand}%`);
  }

  if (model) {
    query = query.where("model", "like", `%${model}%`);
    countQuery = countQuery.where("model", "like", `%${model}%`);
  }

  if (is_available !== undefined && is_available !== "") {
    const isAvail = is_available === "true" || is_available === true ? 1 : 0;
    query = query.where("is_available", isAvail);
    countQuery = countQuery.where("is_available", isAvail);
  }

  if (featured !== undefined && featured !== "") {
    const isFeatured = featured === "true" || featured === true ? 1 : 0;
    query = query.where("is_featured", isFeatured);
    countQuery = countQuery.where("is_featured", isFeatured);
  }

  if (price_min !== undefined && price_min !== "") {
    query = query.where("price", ">=", Number(price_min));
    countQuery = countQuery.where("price", ">=", Number(price_min));
  }
  if (price_max !== undefined && price_max !== "") {
    query = query.where("price", "<=", Number(price_max));
    countQuery = countQuery.where("price", "<=", Number(price_max));
  }

  //Sử dụng whereRaw với toán tử @> để tận dụng GIN Index
  Object.keys(dynamicFilters).forEach((key) => {
    const val = dynamicFilters[key];
    if (val !== undefined && val !== "") {
      const filterObj = { [key]: val };
      query = query.whereRaw("attributes @> ?", [JSON.stringify(filterObj)]);
      countQuery = countQuery.whereRaw("attributes @> ?", [
        JSON.stringify(filterObj),
      ]);
    }
  });

  const [totalRow] = await countQuery.count("* as count");
  const total = Number(totalRow.count || 0);

  const safeLimit = isNaN(Number(limit)) ? 20 : Number(limit);
  const safeOffset = isNaN(Number(offset)) ? 0 : Number(offset);

  const sortMapping = {
    newest: { column: "created_at", direction: "desc" },
    price_asc: { column: "price", direction: "asc" },
    price_desc: { column: "price", direction: "desc" },
    name_asc: { column: "name", direction: "asc" },
  };
  const currentSort = sortMapping[sort] || sortMapping.newest;

  const data = await query
    .orderBy(currentSort.column, currentSort.direction)
    .limit(safeLimit)
    .offset(safeOffset);

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
