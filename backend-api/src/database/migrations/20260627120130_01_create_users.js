exports.up = function (knex) {
  return knex.schema
    .createTable("users", (t) => {
      t.increments("id").primary();
      t.string("name", 100);
      t.string("email", 100).unique();
      t.text("password");
      t.string("role", 20).defaultTo("user");
      t.boolean("is_deleted").defaultTo(false);
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("user_profiles", (t) => {
      t.increments("id").primary();
      t.integer("user_id")
        .unique()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.string("full_name", 100);
      t.date("date_of_birth");
      t.string("gender", 20);
      t.string("phone", 20);
      t.string("avatar", 255);
      t.text("bio");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("user_addresses", (t) => {
      t.increments("id").primary();
      t.integer("user_id").references("id").inTable("users");
      t.string("receiver_name", 100);
      t.string("phone", 20);
      t.string("province", 100);
      t.string("district", 100);
      t.string("ward", 100);
      t.text("address_line");
      t.decimal("latitude", 10, 7);
      t.decimal("longitude", 10, 7);
      t.boolean("is_default").defaultTo(false);
      t.boolean("is_deleted").defaultTo(false);
    })
    .createTable("user_payment_methods", (t) => {
      t.increments("id").primary();
      t.integer("user_id").references("id").inTable("users");
      t.string("bank_name", 100);
      t.string("card_holder_name", 100);
      t.string("card_last4", 4);
      t.integer("expiry_month");
      t.integer("expiry_year");
      t.string("payment_type", 50);
      t.string("provider", 50);
      t.boolean("is_default").defaultTo(false);
      t.boolean("is_deleted").defaultTo(false);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("user_payment_methods")
    .dropTableIfExists("user_addresses")
    .dropTableIfExists("user_profiles")
    .dropTableIfExists("users");
};
