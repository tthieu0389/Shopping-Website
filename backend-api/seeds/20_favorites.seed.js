const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");
  const products = await knex("products").select("id");

  const data = users.flatMap((u) => {
    // Shuffle và lấy 3 sản phẩm khác nhau cho mỗi user để tránh duplicate
    const shuffled = faker.helpers.shuffle([...products]).slice(0, 3);
    return shuffled.map((p) => ({
      user_id: u.id,
      product_id: p.id,
      is_deleted: false,
    }));
  });

  await knex("favorites").insert(data);
};
