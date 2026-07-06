exports.up = function (knex) {
  return knex.schema
    .createTable("categories", (t) => {
      t.increments("id").primary();
      t.string("name", 100);
      t.string("slug", 100);
      t.text("description");
      t.boolean("is_deleted").defaultTo(false);
    })
    .createTable("products", (t) => {
      t.increments("id").primary();
      t.string("name", 200).notNullable();
      t.string("slug", 200).unique().notNullable();
      t.text("description");
      t.decimal("price", 12, 2).notNullable().defaultTo(0.0);
      t.string("product_type", 20);
      t.integer("category_id")
        .references("id")
        .inTable("categories")
        .onDelete("SET NULL");
      t.string("brand", 100).defaultTo("VNPT");
      t.string("model", 100);
      t.jsonb("attributes").defaultTo("{}");
      t.boolean("is_available").defaultTo(true);
      t.boolean("is_featured").defaultTo(false);
      t.boolean("is_deleted").defaultTo(false);
      t.timestamp("deleted_at");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("product_images", (t) => {
      t.increments("id").primary();
      t.integer("product_id")
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      t.text("image_url");
      t.boolean("is_thumbnail").defaultTo(false);
    })
    .createTable("product_details", (t) => {
      t.increments("id").primary();
      t.integer("product_id")
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      t.string("detail_name", 100);
      t.text("detail_value");
    })
    .raw(
      "CREATE INDEX idx_products_category_type ON products(category_id, product_type) WHERE is_deleted = FALSE",
    )
    .raw(
      "CREATE INDEX idx_products_brand_model ON products(brand, model) WHERE is_deleted = FALSE",
    )
    .raw(
      "CREATE INDEX idx_products_price ON products(price) WHERE is_deleted = FALSE",
    )
    .raw(
      "CREATE INDEX idx_products_attributes ON products USING gin (attributes)",
    )
    .raw(
      "CREATE UNIQUE INDEX idx_categories_name_unique ON categories (LOWER(name)) WHERE is_deleted = FALSE",
    )
    .raw(
      "CREATE UNIQUE INDEX idx_categories_slug_unique ON categories (slug) WHERE is_deleted = FALSE",
    );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("product_details")
    .dropTableIfExists("product_images")
    .dropTableIfExists("products")
    .dropTableIfExists("categories");
};
