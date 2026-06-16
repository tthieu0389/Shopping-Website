const knex = require("../database/knex");

// CREATE
exports.createPromotion = async (data) => {
  const [promo] = await knex("promotions").insert(data).returning("*");
  return promo;
};

// GET ALL
exports.getAllPromotions = async () => {
  return knex("promotions").orderBy("id", "desc");
};

// GET BY ID
exports.getPromotionById = async (id) => {
  return knex("promotions").where({ id }).first();
};

// UPDATE
exports.updatePromotion = async (id, data) => {
  const [updated] = await knex("promotions")
    .where({ id })
    .update(data)
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

// BEST PROMOTION (FIXED - ALWAYS RETURN ARRAY OR NULL)
exports.getBestPromotions = async (productId, trx = knex) => {
  const promotions = await exports.getActivePromotionsByProductId(
    productId,
    trx,
  );

  if (!promotions || promotions.length === 0) return [];

  // sort by priority
  promotions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // nếu có non-stackable → chỉ lấy 1 cái mạnh nhất
  const nonStackable = promotions.find((p) => !p.stackable);
  if (nonStackable) return [nonStackable];

  return promotions;
};

// DISCOUNT CALC
exports.calculateDiscount = (price, promotion) => {
  if (!promotion) return 0;

  if (promotion.discount_type === "percent") {
    return price * (promotion.discount_value / 100);
  }

  if (promotion.discount_type === "fixed") {
    return promotion.discount_value;
  }

  return 0;
};

// TOTAL DISCOUNT (STACKING SAFE)
exports.calculateTotalDiscount = (price, promotions = []) => {
  let total = 0;

  for (const promo of promotions) {
    total += exports.calculateDiscount(price, promo);

    if (!promo.stackable) break;
  }

  return total;
};
