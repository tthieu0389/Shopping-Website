const knex = require("../database/knex");

// CREATE CONTACT
exports.createContact = async (data) => {
  const [contact] = await knex("contacts").insert(data).returning("*");

  return contact;
};

// GET ALL (ADMIN)
exports.getContacts = async () => {
  return knex("contacts").orderBy("created_at", "desc");
};

// DELETE
exports.deleteContact = async (id) => {
  return knex("contacts").where({ id }).del();
};
