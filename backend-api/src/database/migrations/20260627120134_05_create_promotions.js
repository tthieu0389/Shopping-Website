exports.up = function (knex) {
  return knex.schema
    .createTable("promotions", (t) => {
      t.increments("id").primary();
      t.string("name", 200).notNullable();
      t.string("discount_type", 20).notNullable().checkIn(["percent", "fixed"]);
      t.decimal("discount_value", 10, 2).notNullable().defaultTo(0);
      t.timestamp("start_date").notNullable();
      t.timestamp("end_date").notNullable();
      t.boolean("is_active").defaultTo(true);
      t.integer("priority").defaultTo(0);
      t.boolean("stackable").defaultTo(true);
    })
    .createTable("product_promotions", (t) => {
      t.increments("id").primary();
      t.integer("product_id")
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      t.integer("promotion_id")
        .references("id")
        .inTable("promotions")
        .onDelete("CASCADE");
      t.unique(["product_id", "promotion_id"]);
    })
    .raw(
      "ALTER TABLE promotions ADD CONSTRAINT chk_promotion_dates CHECK (end_date > start_date)",
    )
    .raw(
      "CREATE INDEX idx_promotions_active_dates ON promotions(is_active, start_date, end_date)",
    );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("product_promotions")
    .dropTableIfExists("promotions");
};
