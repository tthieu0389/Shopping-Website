const knex = require("../database/knex");

exports.createOrUpdateProfile = async (userId, data) => {
  const exists = await knex("user_profiles").where("user_id", userId).first();

  if (exists) {
    const [profile] = await knex("user_profiles")
      .where("user_id", userId)
      .update(data)
      .returning("*");
    return profile;
  }

  const [profile] = await knex("user_profiles")
    .insert({ user_id: userId, ...data })
    .returning("*");

  return profile;
};

exports.getProfileByUserId = async (userId) => {
  return await knex("user_profiles").where("user_id", userId).first();
};

exports.deleteProfile = async (userId) => {
  return await knex("user_profiles").where("user_id", userId).del();
};
