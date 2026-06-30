const knex = require("../database/knex");

// CREATE CONTACT
exports.createContact = async (data, userId = null) => {
  const [contact] = await knex("contacts")
    .insert({ ...data, user_id: userId })
    .returning("*");
  return contact;
};

// GET ALL (ADMIN/STAFF)
exports.getContacts = async () => {
  return knex("contacts as c")
    .leftJoin("users as replier", "c.replied_by", "replier.id")
    .select("c.*", "replier.name as replied_by_name")
    .orderBy("c.created_at", "desc");
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

// STAFF/ADMIN PHẢN HỒI LIÊN HỆ
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
