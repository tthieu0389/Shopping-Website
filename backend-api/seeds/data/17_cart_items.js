const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const carts = await knex("carts").select("id");
  const products = await knex("products").select("id");

  const data = carts.flatMap((cart) => {
    // Shuffle products và lấy 3 cái đầu để đảm bảo không trùng product_id trong cùng cart
    const shuffled = faker.helpers.shuffle([...products]).slice(0, 3);
    return shuffled.map((p) => ({
      cart_id: cart.id,
      product_id: p.id,
      quantity: faker.number.int({ min: 1, max: 5 }),
      is_selected: false,
    }));
  });

  await knex("cart_items")
    .insert(data)
    .onConflict(["cart_id", "product_id"])
    .ignore();
};
