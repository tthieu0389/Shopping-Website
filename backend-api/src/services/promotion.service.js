const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

const pickPromotionFields = (data) => {
  const allowed = [
    "name",
    "discount_type",
    "discount_value",
    "start_date",
    "end_date",
    "is_active",
    "priority",
    "stackable",
  ];
  const result = {};
  for (const key of allowed) {
    if (data[key] !== undefined) result[key] = data[key];
  }
  return result;
};

// CÁC HÀM CƠ BẢN (CRUD)
exports.createPromotion = async (data) => {
  const clean = pickPromotionFields(data);
  const [promo] = await knex("promotions").insert(clean).returning("*");
  return promo;
};

exports.getAllPromotions = async ({ search } = {}) => {
  const query = knex("promotions").orderBy("id", "desc");
  const kw = normalizeKeyword(search);
  if (kw) {
    query.andWhere("name", "ilike", `%${kw}%`);
  }
  return query;
};

exports.getPromotionById = async (id) => {
  if (!id || isNaN(id)) return null;
  return knex("promotions").where({ id }).first();
};

exports.updatePromotion = async (id, data) => {
  if (!id || isNaN(id)) return null;
  const clean = pickPromotionFields(data);
  if (Object.keys(clean).length === 0)
    return knex("promotions").where({ id }).first();
  const [updated] = await knex("promotions")
    .where({ id })
    .update(clean)
    .returning("*");
  return updated;
};

exports.deletePromotion = async (id) => {
  return knex("promotions").where({ id }).del();
};

// LOGIC XỬ LÝ KHUYẾN MÃI (CORE)

// Hàm lọc khuyến mãi tốt nhất (Sử dụng cho cả gọi lẻ hoặc batch)
exports.applyPromotionRules = (promotions) => {
  if (!promotions || promotions.length === 0) return [];

  // Sắp xếp theo độ ưu tiên giảm dần
  promotions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Nếu có promotion không cho cộng dồn (non-stackable), ưu tiên lấy cái đó
  const nonStackable = promotions.find((p) => !p.stackable);
  return nonStackable ? [nonStackable] : promotions;
};

// Lấy danh sách khuyến mãi đang active của 1 sản phẩm
exports.getActivePromotionsByProductId = async (productId, trx = knex) => {
  const now = new Date();
  return trx("product_promotions as pp")
    .join("promotions as p", "pp.promotion_id", "p.id")
    .where("pp.product_id", productId)
    .andWhere("p.is_active", true)
    .andWhere("p.start_date", "<=", now)
    .andWhere("p.end_date", ">=", now)
    .select("p.*");
};

// Lấy khuyến mãi tốt nhất cho 1 sản phẩm (Gọi DB trực tiếp)
exports.getBestPromotions = async (productId, trx = knex) => {
  const promotions = await exports.getActivePromotionsByProductId(
    productId,
    trx,
  );
  return exports.applyPromotionRules(promotions);
};

// Lấy khuyến mãi cho nhiều sản phẩm cùng lúc (Batch Fetching - Tối ưu N+1)
exports.getPromotionsForProducts = async (productIds, trx = knex) => {
  const now = new Date();
  const rows = await trx("product_promotions as pp")
    .join("promotions as p", "pp.promotion_id", "p.id")
    .whereIn("pp.product_id", productIds)
    .andWhere("p.is_active", true)
    .andWhere("p.start_date", "<=", now)
    .andWhere("p.end_date", ">=", now)
    .select("p.*", "pp.product_id");

  const map = {};
  rows.forEach((row) => {
    if (!map[row.product_id]) map[row.product_id] = [];
    map[row.product_id].push(row);
  });
  return map;
};

// Trả về sản phẩm kèm: original_price (giá gốc), sale_price (giá sau KM), discount_percent (% giảm thật)
// Không đổi field "price" gốc để không ảnh hưởng các chỗ khác đang dùng product.price làm đơn giá.
exports.attachPromotionInfo = async (products, trx = knex) => {
  if (!products || products.length === 0) return products;

  const productIds = products.map((p) => p.id);
  const promotionsMap = await exports.getPromotionsForProducts(productIds, trx);

  return products.map((product) => {
    const promotions = exports.applyPromotionRules(
      promotionsMap[product.id] || [],
    );
    const basePrice = Number(product.price);
    const rawDiscountAmount = exports.calculateTotalDiscount(
      basePrice,
      promotions,
    );
    // Không cho phép giảm giá vượt quá giá gốc, tránh discount_percent hiện > 100%
    const discountAmount = Math.min(Math.max(0, rawDiscountAmount), basePrice);
    const salePrice = basePrice - discountAmount;
    const discountPercent =
      basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

    return {
      ...product,
      original_price: basePrice,
      sale_price: salePrice,
      discount_percent: discountPercent,
    };
  });
};

// Lấy danh sách sản phẩm ĐANG có khuyến mãi active (dùng cho trang "Khuyến mãi" / Flash Sale bên FE)
// Không cần biết trước product_id — trả về chính những sản phẩm nào đang giảm giá thật.
exports.getDiscountedProducts = async (
  { limit = 20, offset = 0 } = {},
  trx = knex,
) => {
  const now = new Date();

  const baseQuery = trx("products as pr")
    .join("product_promotions as pp", "pr.id", "pp.product_id")
    .join("promotions as p", "pp.promotion_id", "p.id")
    .join("inventory as inv", "pr.id", "inv.product_id")
    .where("pr.is_deleted", false)
    .andWhere("pr.is_available", true)
    .andWhere("inv.status", "active")
    .andWhere("p.is_active", true)
    .andWhere("p.start_date", "<=", now)
    .andWhere("p.end_date", ">=", now);

  const countRow = await baseQuery
    .clone()
    .countDistinct("pr.id as count")
    .first();

  const products = await baseQuery
    .clone()
    .distinct(
      "pr.id",
      "pr.name",
      "pr.slug",
      "pr.price",
      "pr.brand",
      "pr.category_id",
      "pr.is_available",
    )
    .select(
      trx("product_images")
        .select("image_url")
        .whereRaw("product_id = pr.id")
        .where("is_thumbnail", true)
        .limit(1)
        .as("image_url"),
    )
    .orderBy("pr.id")
    .limit(limit)
    .offset(offset);

  const withPromoInfo = await exports.attachPromotionInfo(products, trx);
  // Query đã lọc is_available/status active/ ngay từ đầu nên ở
  // đây chỉ cần sắp theo % giảm giá thật, không còn hàng hết/ngừng bán lọt qua.
  withPromoInfo.sort((a, b) => b.discount_percent - a.discount_percent);

  return { data: withPromoInfo, total: Number(countRow.count) };
};

// CÁC HÀM TÍNH TOÁN
exports.calculateDiscount = (price, promotion) => {
  if (!promotion) return 0;
  if (promotion.discount_type === "percent")
    return price * (promotion.discount_value / 100);
  if (promotion.discount_type === "fixed") return promotion.discount_value;
  return 0;
};

exports.calculateTotalDiscount = (price, promotions = []) => {
  let total = 0;
  for (const promo of promotions) {
    total += exports.calculateDiscount(price, promo);
    if (!promo.stackable) break;
  }
  return total;
};
