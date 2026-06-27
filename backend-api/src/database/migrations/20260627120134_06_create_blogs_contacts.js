exports.up = function (knex) {
  return knex.schema
    .createTable("blogs", (t) => {
      t.increments("id").primary();
      t.string("title", 200);
      t.string("slug", 200);
      t.text("content");
      t.boolean("is_deleted").defaultTo(false);
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("contacts", (t) => {
      t.increments("id").primary();
      t.string("name", 100);
      t.string("email", 100);
      t.text("message");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("contacts").dropTableIfExists("blogs");
};
