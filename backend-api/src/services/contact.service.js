const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

const ALLOWED_CONTACT_STATUSES = ["pending", "resolved"];

// CREATE CONTACT
exports.createContact = async (data, userId = null) => {
  const [contact] = await knex("contacts")
    .insert({ ...data, user_id: userId })
    .returning("*");
  return contact;
};

// GET ALL (ADMIN/STAFF) — hỗ trợ filter theo trạng thái đã/chưa phản hồi
exports.getContacts = async ({ search, status } = {}) => {
  const query = knex("contacts as c")
    .leftJoin("users as replier", "c.replied_by", "replier.id")
    .select("c.*", "replier.name as replied_by_name")
    .orderBy("c.created_at", "desc");

  const kw = normalizeKeyword(search);
  if (kw) {
    query.andWhere((qb) => {
      qb.where("c.name", "ilike", `%${kw}%`)
        .orWhere("c.email", "ilike", `%${kw}%`)
        .orWhere("c.message", "ilike", `%${kw}%`);
    });
  }

  if (status && ALLOWED_CONTACT_STATUSES.includes(status)) {
    query.andWhere("c.status", status);
  }

  return query;
};

// GET CONTACT BY ID (Dùng cho Admin/Staff xem chi tiết)
exports.getContactById = async (id) => {
  const contact = await knex("contacts as c")
    .leftJoin("users as replier", "c.replied_by", "replier.id")
    .select("c.*", "replier.name as replied_by_name")
    .where("c.id", id)
    .first();

  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }
  return contact;
};

// GET CONTACT CỦA CHÍNH USER ĐANG ĐĂNG NHẬP
exports.getContactsByUser = async (userId) => {
  return knex("contacts as c")
    .leftJoin("users as replier", "c.replied_by", "replier.id")
    .select("c.*", "replier.name as replied_by_name")
    .where("c.user_id", userId)
    .orderBy("c.created_at", "desc");
};

// GET CONTACT THEO ĐƠN HÀNG (Admin/Staff)
exports.getContactsByOrder = async (orderId) => {
  const order = await knex("orders").where({ id: orderId }).first();
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  return knex("contacts as c")
    .leftJoin("users as replier", "c.replied_by", "replier.id")
    .select("c.*", "replier.name as replied_by_name")
    .where("c.order_id", orderId)
    .orderBy("c.created_at", "desc");
};

// STAFF/ADMIN PHẢN HỒI LIÊN HỆ (tự động chuyển status -> resolved)
exports.replyContact = async (id, replierId, reply) => {
  const contact = await knex("contacts").where({ id }).first();
  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  const [updated] = await knex("contacts")
    .where({ id })
    .update({
      reply,
      replied_by: replierId,
      replied_at: knex.fn.now(),
      status: "resolved",
    })
    .returning("*");

  return updated;
};

// ADMIN ĐÁNH DẤU LIÊN HỆ ĐÃ XỬ LÝ (pending -> resolved)
exports.resolveContact = async (id) => {
  return await knex.transaction(async (trx) => {
    const contact = await trx("contacts").where({ id }).forUpdate().first();
    if (!contact) {
      const err = new Error("Contact not found");
      err.statusCode = 404;
      throw err;
    }

    if (contact.status === "resolved") {
      const err = new Error("Liên hệ này đã được xử lý (resolved) trước đó");
      err.statusCode = 409;
      throw err;
    }

    const [updated] = await trx("contacts")
      .where({ id })
      .update({ status: "resolved" })
      .returning("*");

    return updated;
  });
};

// DELETE
exports.deleteContact = async (id) => {
  const deleted = await knex("contacts").where({ id }).del();
  if (!deleted) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};
