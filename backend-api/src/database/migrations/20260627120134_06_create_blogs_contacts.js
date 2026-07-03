exports.up = function (knex) {
  return knex.schema
    .createTable("blogs", (t) => {
      t.increments("id").primary();
      t.string("title", 200);
      t.string("slug", 200);
      t.text("content");
      t.text("thumbnail_url");
      t.boolean("is_deleted").defaultTo(false);
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("blog_images", (t) => {
      t.increments("id").primary();
      t.integer("blog_id")
        .references("id")
        .inTable("blogs")
        .onDelete("CASCADE");
      t.text("image_url").notNullable();
      t.string("alt_text", 200);
      t.integer("sort_order").defaultTo(0);
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("contacts", (t) => {
      t.increments("id").primary();
      t.string("name", 100);
      t.string("email", 100);
      t.text("message");
      t.integer("user_id")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      t.integer("order_id")
        .references("id")
        .inTable("orders")
        .onDelete("SET NULL");
      t.string("status", 20).defaultTo("pending"); 
      t.text("reply");
      t.integer("replied_by")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      t.timestamp("replied_at");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .raw("CREATE INDEX idx_blog_images_blog_id ON blog_images(blog_id)")
    .raw("CREATE INDEX idx_contacts_order_id ON contacts(order_id)");
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("contacts")
    .dropTableIfExists("blog_images")
    .dropTableIfExists("blogs");
};
