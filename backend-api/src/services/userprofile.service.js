const knex = require("../database/knex");

const mapToDbColumns = (data) => {
  const { birthday, ...rest } = data;
  if (birthday !== undefined) rest.date_of_birth = birthday;
  return rest;
};

exports.createOrUpdateProfile = async (userId, data) => {
  const payload = mapToDbColumns(data);
  const exists = await knex("user_profiles").where("user_id", userId).first();

  if (exists) {
    const [profile] = await knex("user_profiles")
      .where("user_id", userId)
      .update(payload)
      .returning("*");
    return profile;
  }

  const [profile] = await knex("user_profiles")
    .insert({ user_id: userId, ...payload })
    .returning("*");

  return profile;
};

exports.getProfileByUserId = async (userId) => {
  return await knex("user_profiles").where("user_id", userId).first();
};

exports.deleteProfile = async (userId) => {
  return await knex("user_profiles").where("user_id", userId).del();
};
