exports.up = function (knex) {
  return knex.schema
    .createTable("carts", (t) => {
      t.increments("id").primary();
      t.integer("user_id").unique().references("id").inTable("users");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("cart_items", (t) => {
      t.increments("id").primary();
      t.integer("cart_id").references("id").inTable("carts");
      t.integer("product_id").references("id").inTable("products");
      t.integer("quantity").defaultTo(1);
      t.boolean("is_selected").defaultTo(false);
      t.timestamp("created_at").defaultTo(knex.fn.now());
      t.timestamp("updated_at").defaultTo(knex.fn.now());
      t.unique(["cart_id", "product_id"]);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("cart_items").dropTableIfExists("carts");
};
