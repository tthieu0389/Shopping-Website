const knex = require("../database/knex");

// ADD FAVORITE
exports.addFavorite = async (userId, productId) => {
  const existing = await knex("favorites")
    .where({ user_id: userId, product_id: productId })
    .first();

  if (existing) {
    if (!existing.is_deleted) return existing;
    const [revived] = await knex("favorites")
      .where({ id: existing.id })
      .update({ is_deleted: false })
      .returning("*");
    return revived;
  }

  const [fav] = await knex("favorites")
    .insert({
      user_id: userId,
      product_id: productId,
    })
    .returning("*");

  return fav;
};

// GET FAVORITES
exports.getFavorites = async (userId) => {
  return knex("favorites as f")
    .join("products as p", "f.product_id", "p.id")
    .where("f.user_id", userId)
    .andWhere("f.is_deleted", false)
    .select("f.id", "p.id as product_id", "p.name", "p.price");
};

// REMOVE FAVORITE
exports.removeFavorite = async (userId, productId) => {
  return knex("favorites")
    .where({ user_id: userId, product_id: productId })
    .update({ is_deleted: true });
};
