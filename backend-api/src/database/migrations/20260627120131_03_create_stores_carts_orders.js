exports.up = function (knex) {
  return knex.schema
    .createTable("stores", (t) => {
      t.increments("id").primary();
      t.string("name", 100);
      t.string("province", 100);
      t.text("address");
      t.string("phone", 20);
      t.boolean("is_deleted").defaultTo(false);
    })
    .createTable("carts", (t) => {
      t.increments("id").primary();
      t.integer("user_id").unique().references("id").inTable("users");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("orders", (t) => {
      t.increments("id").primary();
      t.string("order_code", 50).unique();
      t.integer("user_id").references("id").inTable("users");
      t.integer("address_id").references("id").inTable("user_addresses");
      t.integer("pickup_store_id").references("id").inTable("stores");
      t.string("receiver_name", 100);
      t.string("receiver_phone", 20);
      t.text("shipping_address");
      t.decimal("shipping_fee", 12, 2).defaultTo(0);
      t.decimal("total_amount", 12, 2);
      t.string("payment_method", 30);
      t.string("status", 30).defaultTo("pending");
      t.text("note");
      t.integer("created_by_staff_id")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
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
    })
    .createTable("order_items", (t) => {
      t.increments("id").primary();
      t.integer("order_id")
        .notNullable()
        .references("id")
        .inTable("orders")
        .onDelete("CASCADE");
      t.integer("product_id")
        .notNullable()
        .references("id")
        .inTable("products");
      t.string("product_name", 200);
      t.integer("quantity").notNullable();
      t.decimal("base_price", 12, 2).notNullable();
      t.decimal("unit_price", 12, 2).notNullable();
      t.decimal("discount_amount", 12, 2).defaultTo(0);
      t.decimal("final_price", 12, 2).notNullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("order_items")
    .dropTableIfExists("cart_items")
    .dropTableIfExists("orders")
    .dropTableIfExists("carts")
    .dropTableIfExists("stores");
};
