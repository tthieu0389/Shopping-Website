const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");
  const products = await knex("products").select("id");

  const seen = new Set();
  const data = [];

  // Shuffle users để phân phối đều hơn
  const shuffledUsers = faker.helpers.shuffle([...users]);

  for (const user of shuffledUsers) {
    // Mỗi user review tối đa 3 sản phẩm khác nhau
    const pickedProducts = faker.helpers.arrayElements(products, {
      min: 1,
      max: 3,
    });

    for (const product of pickedProducts) {
      const key = `${user.id}_${product.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      data.push({
        user_id: user.id,
        product_id: product.id,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.sentence(),
        is_deleted: false,
      });
    }
  }

  await knex("reviews")
    .insert(data)
    .onConflict(["user_id", "product_id"])
    .ignore();
};
