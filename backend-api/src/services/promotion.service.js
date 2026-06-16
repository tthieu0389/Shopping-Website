const knex = require("../database/knex");

const pickPromotionFields = (data) => {
  const allowed = [
    "name",
    "discount_type",
    "discount_value",
    "start_date",
    "end_date",
    "is_active",
  ];
  const result = {};
  for (const key of allowed) {
    if (data[key] !== undefined) result[key] = data[key];
  }
  return result;
};

// CREATE
exports.createPromotion = async (data) => {
  const clean = pickPromotionFields(data);
  const [promo] = await knex("promotions").insert(clean).returning("*");
  return promo;
};

// GET ALL
exports.getAllPromotions = async () => {
  return knex("promotions").orderBy("id", "desc");
};

// GET BY ID
exports.getPromotionById = async (id) => {
  if (!id || isNaN(id)) return null;
  return knex("promotions").where({ id }).first();
};

// UPDATE
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

// DELETE
exports.deletePromotion = async (id) => {
  return knex("promotions").where({ id }).del();
};

// ACTIVE PROMOTIONS
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

exports.getBestPromotions = async (productId, trx = knex) => {
  const promotions = await exports.getActivePromotionsByProductId(
    productId,
    trx,
  );
  if (!promotions || promotions.length === 0) return [];
  promotions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const nonStackable = promotions.find((p) => !p.stackable);
  if (nonStackable) return [nonStackable];
  return promotions;
};

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
