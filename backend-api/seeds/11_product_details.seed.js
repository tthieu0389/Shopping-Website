const { faker } = require("@faker-js/faker/locale/vi");

const detailTemplates = [
  ["RAM", "8GB"],
  ["Storage", "256GB"],
  ["Color", "Black"],
  ["Battery", "4000mAh"],
  ["Weight", "180g"],
];

exports.seed = async function (knex) {
  const products = await knex("products").select("id");

  const data = products.flatMap((p) =>
    detailTemplates.map(([name, value]) => ({
      product_id: p.id,
      detail_name: name,
      detail_value: value,
    })),
  );

  await knex("product_details").insert(data);
};
