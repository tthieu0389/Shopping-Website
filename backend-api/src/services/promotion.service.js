const knex = require("../database/knex");

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

exports.getAllPromotions = async () => {
  return knex("promotions").orderBy("id", "desc");
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
