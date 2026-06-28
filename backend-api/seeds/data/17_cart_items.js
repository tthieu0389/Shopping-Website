const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const carts = await knex("carts").select("id");
  const products = await knex("products").select("id");

  // Load inventory để không seed cart_items vượt tồn kho
  const inventoryList = await knex("inventory").select(
    "product_id",
    "quantity",
  );
  const inventoryMap = {};
  for (const inv of inventoryList) {
    inventoryMap[inv.product_id] = inv.quantity;
  }

  const data = carts.flatMap((cart) => {
    const shuffled = faker.helpers.shuffle([...products]).slice(0, 3);
    return shuffled
      .map((p) => {
        const stock = inventoryMap[p.id] ?? 0;
        if (stock <= 0) return null; // bỏ qua sản phẩm hết hàng

        const maxQty = Math.min(5, stock);
        return {
          cart_id: cart.id,
          product_id: p.id,
          quantity: faker.number.int({ min: 1, max: maxQty }),
          is_selected: false,
        };
      })
      .filter(Boolean); // loại null
  });

  await knex("cart_items")
    .insert(data)
    .onConflict(["cart_id", "product_id"])
    .ignore();
};
