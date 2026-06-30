const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const inventory = await knex("inventory").select(
    "id",
    "product_id",
    "quantity",
  );
  const users = await knex("users").select("id");

  const actions = ["import", "export", "adjust"];

  const data = inventory.map((inv) => {
    const change = faker.number.int({ min: 1, max: 50 });
    const before = inv.quantity;

    return {
      inventory_id: inv.id,
      product_id: inv.product_id,
      action: faker.helpers.arrayElement(actions),
      quantity_before: before,
      quantity_change: change,
      quantity_after: before + change,
      reference_id: null,
      note: "auto seed log",
      created_by: faker.helpers.arrayElement(users).id,
    };
  });

  await knex("inventory_logs").insert(data);
};
