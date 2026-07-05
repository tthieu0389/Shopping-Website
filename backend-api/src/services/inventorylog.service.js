const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

// GET ALL (phân trang + lọc theo action/product_id + tìm theo tên sản phẩm,
// người thao tác hoặc nội dung ghi chú)
exports.getAllInventoryLogs = async ({
  limit,
  offset,
  action,
  product_id,
  search,
}) => {
  const validActions = ["import", "export", "adjust", "delete"];
  const kw = normalizeKeyword(search);

  const baseQuery = () => {
    const q = knex("inventory_logs as l")
      .leftJoin("products as p", "l.product_id", "p.id")
      .leftJoin("users as u", "l.created_by", "u.id");

    if (action && validActions.includes(action)) {
      q.where("l.action", action);
    }

    if (product_id) {
      q.where("l.product_id", product_id);
    }

    if (kw) {
      q.andWhere((qb) => {
        qb.where("p.name", "ilike", `%${kw}%`)
          .orWhere("u.name", "ilike", `%${kw}%`)
          .orWhere("l.note", "ilike", `%${kw}%`);
      });
    }

    return q;
  };

  const data = await baseQuery()
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
      "u.name as created_by_name",
      "l.created_at",
    )
    .orderBy("l.id", "desc")
    .limit(limit)
    .offset(offset);

  const [{ count }] = await baseQuery().count("l.id as count");

  return { data, total: Number(count) };
};

// GET BY INVENTORY ID
exports.getLogsByInventoryId = async (inventory_id) => {
  return await knex("inventory_logs as l")
    .leftJoin("products as p", "l.product_id", "p.id")
    .leftJoin("users as u", "l.created_by", "u.id")
    .where("l.inventory_id", inventory_id)
    .select("l.*", "p.name as product_name", "u.name as created_by_name")
    .orderBy("l.id", "desc");
};

// GET BY PRODUCT ID
exports.getLogsByProductId = async (product_id) => {
  return await knex("inventory_logs as l")
    .leftJoin("users as u", "l.created_by", "u.id")
    .where("l.product_id", product_id)
    .orderBy("l.id", "desc")
    .select("l.*", "u.name as created_by_name");
};
