const knex2 = require("../database/knex");

//GET ALL LOGS
exports.getAllInventoryLogs = async ({ limit, offset }) => {
  return await knex2("inventory_logs as l")
    .leftJoin("products as p", "l.product_id", "p.id")
    .select(
      "l.id",
      "l.inventory_id",
      "l.product_id",
      "p.name as product_name",
      "l.action",
      "l.quantity_before",
      "l.quantity_change",
      "l.quantity_after",
      "l.reference_id",
      "l.note",
      "l.created_by",
      "l.created_at",
    )
    .orderBy("l.id", "desc")
    .limit(limit)
    .offset(offset);
};

//GET BY INVENTORY ID
exports.getLogsByInventoryId = async (inventory_id) => {
  return await knex2("inventory_logs as l")
    .leftJoin("products as p", "l.product_id", "p.id")
    .where("l.inventory_id", inventory_id)
    .select("l.*", "p.name as product_name")
    .orderBy("l.id", "desc");
};

//GET BY PRODUCT ID
exports.getLogsByProductId = async (product_id) => {
  return await knex2("inventory_logs as l")
    .where("l.product_id", product_id)
    .orderBy("l.id", "desc")
    .select("*");
};
