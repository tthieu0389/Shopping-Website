exports.up = function (knex) {
  return knex.schema
    .createTable("promotions", (t) => {
      t.increments("id").primary();
      t.string("name", 200);
      t.string("discount_type", 20);
      t.decimal("discount_value", 10, 2);
      t.timestamp("start_date");
      t.timestamp("end_date");
      t.boolean("is_active").defaultTo(true);
    })
    .createTable("product_promotions", (t) => {
      t.increments("id").primary();
      t.integer("product_id").references("id").inTable("products");
      t.integer("promotion_id").references("id").inTable("promotions");
      t.unique(["product_id", "promotion_id"]);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("product_promotions")
    .dropTableIfExists("promotions");
};
