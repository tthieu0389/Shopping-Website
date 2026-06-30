exports.up = function (knex) {
  return knex.schema
    .createTable("inventory", (t) => {
      t.increments("id").primary();
      t.integer("product_id").unique().references("id").inTable("products");
      t.integer("quantity").defaultTo(0);
      t.integer("min_quantity").defaultTo(5);
      t.string("status", 20).defaultTo("active");
      t.check("status IN ('active', 'inactive', 'archived')");
      t.timestamp("deleted_at");
      t.timestamp("updated_at").defaultTo(knex.fn.now());
    })
    .createTable("inventory_logs", (t) => {
      t.increments("id").primary();
      t.integer("inventory_id")
        .references("id")
        .inTable("inventory")
        .onDelete("CASCADE");
      t.integer("product_id").references("id").inTable("products");
      t.string("action", 20).notNullable();
      t.integer("quantity_before");
      t.integer("quantity_change");
      t.integer("quantity_after");
      t.integer("reference_id");
      t.text("note");
      t.integer("created_by").references("id").inTable("users");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("inventory_logs")
    .dropTableIfExists("inventory");
};
