const knex = require("../database/knex");
const promotionService = require("./promotion.service");
const { normalizeKeyword } = require("../utils/searchKeyword");

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

// Filter dùng chung cho cả 2 hàm list bên dưới (search, category, brand, giá...)
const applyCommonFilters = (query, countQuery, filters) => {
  const {
    q,
    search,
    category_id,
    product_type,
    brand,
    model,
    is_available,
    featured,
    price_min,
    price_max,
    limit: _l,
    page: _p,
    offset: _o,
    sort: _sort,
    inventory_status: _invStatus,
    ...dynamicFilters
  } = filters;

  const kw = normalizeKeyword(q || search);

  if (kw) {
    const slugKw = kw.toLowerCase().replace(/\s+/g, "-");
    // Search chung gõ 1 ô: khớp tên, slug, thương hiệu, model — không gồm
    // description vì cột này quá dài (có thể vài nghìn từ), ilike trên đó
    // vừa tốn chi phí vừa không có ý nghĩa tìm kiếm (không ai gõ trúng 1 đoạn
    // trong mô tả dài để tìm sản phẩm).
    const searchBlock = (builder) => {
      builder
        .whereILike("name", `%${kw}%`)
        .orWhereILike("slug", `%${slugKw}%`)
        .orWhereILike("brand", `%${kw}%`)
        .orWhereILike("model", `%${kw}%`);
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

  const brandKw = normalizeKeyword(brand);
  if (brandKw) {
    query = query.where("brand", "ilike", `%${brandKw}%`);
    countQuery = countQuery.where("brand", "ilike", `%${brandKw}%`);
  }

  const modelKw = normalizeKeyword(model);
  if (modelKw) {
    query = query.where("model", "ilike", `%${modelKw}%`);
    countQuery = countQuery.where("model", "ilike", `%${modelKw}%`);
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

  // Dùng @> để tận dụng GIN Index trên cột attributes
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

  return { query, countQuery };
};

// Thực thi query + format kết quả, dùng chung cho cả 2 hàm list
const runQueryAndFormat = async ({
  query,
  countQuery,
  limit,
  offset,
  sort,
}) => {
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

  let orderedQuery = query.orderByRaw(
    `CASE WHEN is_available = false OR COALESCE((select quantity from inventory where product_id = p.id and status = 'active' limit 1), 0) = 0 THEN 1 ELSE 0 END ASC`,
  );

  if (sort === "best_seller") {
    // Sắp xếp theo tổng số lượng đã bán, chỉ tính từ đơn hàng đã hoàn tất
    orderedQuery = orderedQuery.orderByRaw(
      `COALESCE((
        SELECT SUM(oi.quantity)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id AND o.status = 'completed'
      ), 0) DESC`,
    );
  } else {
    const currentSort = sortMapping[sort] || sortMapping.newest;
    orderedQuery = orderedQuery.orderBy(
      currentSort.column,
      currentSort.direction,
    );
  }

  const data = await orderedQuery
    .orderBy("p.id", "asc")
    .limit(safeLimit)
    .offset(safeOffset);

  const dataWithPromo = await promotionService.attachPromotionInfo(data);
  return { data: dataWithPromo, total };
};

// PUBLIC: luôn ẩn sản phẩm có tồn kho inactive/archived
exports.getAllProducts = async ({ limit, offset, filters = {} }) => {
  let countQuery = knex("products").where("is_deleted", false);

  let query = knex("products as p")
    .select("p.*")
    .select(
      knex("product_images")
        .select("image_url")
        .whereRaw("product_id = p.id")
        .where("is_thumbnail", true)
        .limit(1)
        .as("thumbnail_url"),
    )
    .select(
      knex("inventory")
        .select("quantity")
        .whereRaw("product_id = p.id")
        .where("status", "active")
        .limit(1)
        .as("stock"),
    )
    .where("p.is_deleted", false)
    .whereNotExists(
      knex("inventory")
        .select(1)
        .whereRaw("product_id = p.id")
        .whereIn("status", ["inactive", "archived"]),
    );

  countQuery = countQuery.whereNotExists(
    knex("inventory")
      .select(1)
      .whereRaw("product_id = products.id")
      .whereIn("status", ["inactive", "archived"]),
  );

  ({ query, countQuery } = applyCommonFilters(query, countQuery, filters));

  return runQueryAndFormat({
    query,
    countQuery,
    limit,
    offset,
    sort: filters.sort,
  });
};

// ADMIN/STAFF: thấy cả active + inactive (archived luôn bị ẩn, không filter ra được)
exports.getAllProductsForAdmin = async ({ limit, offset, filters = {} }) => {
  let countQuery = knex("products").where("is_deleted", false);

  let query = knex("products as p")
    .select("p.*")
    .select(
      knex("product_images")
        .select("image_url")
        .whereRaw("product_id = p.id")
        .where("is_thumbnail", true)
        .limit(1)
        .as("thumbnail_url"),
    )
    .select(
      // Lấy quantity thật của cả active lẫn inactive.
      knex("inventory")
        .select("quantity")
        .whereRaw("product_id = p.id")
        .whereIn("status", ["active", "inactive"])
        .limit(1)
        .as("stock"),
    )
    .select(
      knex("inventory")
        .select("status")
        .whereRaw("product_id = p.id")
        .limit(1)
        .as("inventory_status"),
    )
    .where("p.is_deleted", false)
    // Archived = đã soft-delete tồn kho, luôn ẩn, không có filter nào lấy ra được
    .whereNotExists(
      knex("inventory")
        .select(1)
        .whereRaw("product_id = p.id")
        .where("status", "archived"),
    );

  countQuery = countQuery.whereNotExists(
    knex("inventory")
      .select(1)
      .whereRaw("product_id = products.id")
      .where("status", "archived"),
  );

  const { inventory_status } = filters;
  const validStatuses = ["active", "inactive"];

  // Không truyền hoặc giá trị lạ - mặc định lấy cả active + inactive
  if (inventory_status && validStatuses.includes(inventory_status)) {
    query = query.whereExists(
      knex("inventory")
        .select(1)
        .whereRaw("product_id = p.id")
        .where("status", inventory_status),
    );
    countQuery = countQuery.whereExists(
      knex("inventory")
        .select(1)
        .whereRaw("product_id = products.id")
        .where("status", inventory_status),
    );
  }

  ({ query, countQuery } = applyCommonFilters(query, countQuery, filters));

  return runQueryAndFormat({
    query,
    countQuery,
    limit,
    offset,
    sort: filters.sort,
  });
};

exports.getProductByIdOrSlug = async (idOrSlug) => {
  const product = await knex("products")
    .where(
      !isNaN(idOrSlug)
        ? { id: Number(idOrSlug), is_deleted: false }
        : { slug: idOrSlug, is_deleted: false },
    )
    .whereNotExists(
      knex("inventory")
        .select(1)
        .whereRaw("product_id = products.id")
        .whereIn("status", ["inactive", "archived"]),
    )
    .first();
  if (!product) return null;
  product.images = await knex("product_images").where({
    product_id: product.id,
  });
  product.details = await knex("product_details").where({
    product_id: product.id,
  });

  const [productWithPromo] = await promotionService.attachPromotionInfo([
    product,
  ]);
  return productWithPromo;
};

exports.getRelatedProducts = async (id) => {
  if (!id || isNaN(id)) return [];
  const product = await knex("products")
    .where({ id, is_deleted: false })
    .first();
  if (!product) return [];

  const related = await knex("products as p")
    .select("p.*")
    .select(
      knex("product_images")
        .select("image_url")
        .whereRaw("product_id = p.id")
        .where("is_thumbnail", true)
        .limit(1)
        .as("thumbnail_url"),
    )
    .select(
      knex("inventory")
        .select("quantity")
        .whereRaw("product_id = p.id")
        .where("status", "active")
        .limit(1)
        .as("stock"),
    )
    .where("p.category_id", product.category_id)
    .where("p.is_deleted", false)
    .whereNot("p.id", id)
    .whereNotExists(
      knex("inventory")
        .select(1)
        .whereRaw("product_id = p.id")
        .whereIn("status", ["inactive", "archived"]),
    )
    // Đẩy sản phẩm hết hàng hoặc bị ẩn (is_available=false hoặc quantity=0) xuống cuối
    .orderByRaw(
      `CASE WHEN is_available = false OR COALESCE((select quantity from inventory where product_id = p.id and status = 'active' limit 1), 0) = 0 THEN 1 ELSE 0 END ASC`,
    )
    .orderBy("p.id", "desc")
    .limit(8);

  return await promotionService.attachPromotionInfo(related);
};

exports.getDistinctModels = async () => {
  const rows = await knex("products")
    .distinct("model")
    .whereNotNull("model")
    .andWhere("model", "!=", "")
    .andWhere("is_deleted", false)
    .orderBy("model", "asc");
  return rows.map((r) => r.model);
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

  // Chặn bật bán nếu tồn kho chưa active
  const wantsAvailable =
    data.is_available === true ||
    data.is_available === "true" ||
    data.is_available === 1;
  if (wantsAvailable) {
    const inventory = await knex("inventory").where({ product_id: id }).first();
    if (!inventory || inventory.status !== "active") {
      const err = new Error(
        "Không thể bật bán sản phẩm khi tồn kho chưa ở trạng thái active. Vui lòng kích hoạt lại tồn kho trước.",
      );
      err.statusCode = 400;
      throw err;
    }
    // Chặn luôn trường hợp status active nhưng quantity = 0 (hết hàng)
    // — tránh FE gửi is_available=true bừa khi kho đã cạn, gây lệch trạng
    // thái hiển thị (VD: "Hết hàng" nhưng vẫn "Đang bán").
    if (inventory.quantity <= 0) {
      const err = new Error(
        "Không thể bật bán sản phẩm khi tồn kho đã hết hàng (quantity = 0).",
      );
      err.statusCode = 400;
      throw err;
    }
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
