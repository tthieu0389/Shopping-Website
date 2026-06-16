const knex = require("../database/knex");

exports.createStore = async (data) => {
  const [store] = await knex("stores").insert(data).returning("*");
  return store;
};

exports.getAllStores = async () => {
  return await knex("stores")
    .where({ is_deleted: false })
    .orderBy("id", "desc");
};

exports.updateStore = async (id, data) => {
  const [store] = await knex("stores")
    .where({ id, is_deleted: false })
    .update({
      ...data,
    })
    .returning("*");

  return store;
};

exports.deleteStore = async (id) => {
  return await knex("stores").where({ id }).update({ is_deleted: true });
};
