exports.seed = async function (knex) {
  const users = await knex("users").select("id");

  const data = users.map((u) => ({
    user_id: u.id,
  }));

  await knex("carts").insert(data).onConflict("user_id").merge();
};
