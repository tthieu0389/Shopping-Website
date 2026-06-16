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
  const [product] = await knex("products").insert(data).returning("*");
  return product;
};

exports.getAllProducts = async ({ limit, offset, filters = {} }) => {
  let query = knex("products").where("is_deleted", false).select("*");
  let countQuery = knex("products").where("is_deleted", false);

  if (filters.search) {
    query = query.where((builder) => {
      builder
        .where("name", "ilike", `%${filters.search}%`)
        .orWhere("slug", "ilike", `%${filters.search}%`);
    });
    countQuery = countQuery.where((builder) => {
      builder
        .where("name", "ilike", `%${filters.search}%`)
        .orWhere("slug", "ilike", `%${filters.search}%`);
    });
  }

  if (filters.category_id) {
    query = query.where("category_id", filters.category_id);
    countQuery = countQuery.where("category_id", filters.category_id);
  }

  if (filters.product_type) {
    query = query.where("product_type", filters.product_type);
    countQuery = countQuery.where("product_type", filters.product_type);
  }

  if (filters.is_available !== undefined && filters.is_available !== "") {
    const isAvailable = filters.is_available === "true";
    query = query.where("is_available", isAvailable);
    countQuery = countQuery.where("is_available", isAvailable);
  }

  const [totalRow] = await countQuery.count("* as count");
  const total = Number(totalRow.count);
  const data = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return { data, total };
};

exports.getProductById = async (id) => {
  if (!id || isNaN(id)) return null;
  return await knex("products").where({ id, is_deleted: false }).first();
};

exports.updateProduct = async (id, data) => {
  if (!id || isNaN(id)) {
    const err = new Error("Invalid product ID");
    err.statusCode = 400;
    throw err;
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
