exports.up = function (knex) {
  return knex.schema
    .createTable("reviews", (t) => {
      t.increments("id").primary();
      t.integer("user_id")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      t.integer("product_id")
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      t.integer("rating").checkBetween([1, 5]).notNullable();
      t.text("comment");
      t.boolean("is_deleted").defaultTo(false);
      t.timestamp("created_at").defaultTo(knex.fn.now());
      t.unique(["user_id", "product_id"]);
    })
    .createTable("favorites", (t) => {
      t.increments("id").primary();
      t.integer("user_id").references("id").inTable("users");
      t.integer("product_id").references("id").inTable("products");
      t.boolean("is_deleted").defaultTo(false);
      t.unique(["user_id", "product_id"]);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("favorites")
    .dropTableIfExists("reviews");
};
