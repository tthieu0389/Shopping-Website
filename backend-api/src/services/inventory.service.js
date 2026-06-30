const knex = require("../database/knex");

// CREATE INVENTORY
exports.createInventory = async (
  { product_id, quantity = 0, min_quantity = 5 },
  created_by = null,
) => {
  return await knex.transaction(async (trx) => {
    const product = await trx("products")
      .where({ id: product_id })
      .forUpdate()
      .first();

    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    const existing = await trx("inventory").where({ product_id }).first();

    if (existing) {
      const err = new Error(
        "Sản phẩm này đã có tồn kho, vui lòng dùng chức năng cập nhật thay vì tạo mới.",
      );
      err.statusCode = 409;
      throw err;
    }

    const [inventory] = await trx("inventory")
      .insert({
        product_id,
        quantity,
        min_quantity,
        status: "active",
        updated_at: trx.fn.now(),
      })
      .returning("*");

    await trx("inventory_logs").insert({
      inventory_id: inventory.id,
      product_id,
      action: "import",
      reference_id: null,
      quantity_before: 0,
      quantity_change: quantity,
      quantity_after: quantity,
      note: "Initial stock",
      created_by,
      created_at: trx.fn.now(),
    });

    await trx("products")
      .where({ id: product_id })
      .update({ is_available: quantity > 0 });

    return inventory;
  });
};

// GET ALL INVENTORY
exports.getAllInventory = async ({ limit, offset }) => {
  const data = await knex("inventory as i")
    .leftJoin("products as p", "i.product_id", "p.id")
    .select(
      "i.id",
      "i.product_id",
      "p.name as product_name",
      "p.is_available",
      "i.quantity",
      "i.min_quantity",
      "i.status",
      "i.updated_at",
    )
    .where("i.status", "active")
    .orderBy("i.id", "desc")
    .limit(limit)
    .offset(offset);

  const [totalRow] = await knex("inventory")
    .count("* as count")
    .where("status", "active");
  return { data, total: Number(totalRow.count) };
};

// UPDATE INVENTORY (ADJUST)
exports.updateInventory = async (id, data, created_by = null) => {
  return await knex.transaction(async (trx) => {
    const old = await trx("inventory").where({ id }).forUpdate().first();
    if (!old) return null;

    const updatedFields = { updated_at: trx.fn.now() };
    if (data.quantity !== undefined) {
      if (data.quantity < 0) throw new Error("Quantity cannot be negative");
      updatedFields.quantity = data.quantity;
    }
    if (data.min_quantity !== undefined)
      updatedFields.min_quantity = data.min_quantity;
    if (data.status !== undefined) updatedFields.status = data.status;

    const [updated] = await trx("inventory")
      .where({ id })
      .update(updatedFields)
      .returning("*");

    if (data.quantity !== undefined && data.quantity !== old.quantity) {
      await trx("inventory_logs").insert({
        inventory_id: id,
        product_id: old.product_id,
        action: "adjust",
        quantity_before: old.quantity,
        quantity_change: data.quantity - old.quantity,
        quantity_after: data.quantity,
        note: "Manual adjustment",
        created_by,
        created_at: trx.fn.now(),
      });
    }

    await trx("products")
      .where({ id: old.product_id })
      .update({
        is_available: (updated.quantity ?? old.quantity) > 0,
      });

    return updated;
  });
};

// DECREASE STOCK
exports.decreaseStock = async (
  trx,
  product_id,
  amount,
  reference_id = null,
) => {
  const db = trx || knex;

  const inventory = await db("inventory")
    .where({ product_id })
    .forUpdate()
    .first();

  if (!inventory) throw new Error("Inventory not found");
  if (amount <= 0) throw new Error("Invalid amount");
  if (inventory.quantity < amount) throw new Error("Not enough stock");

  const newQty = inventory.quantity - amount;

  await db("inventory").where({ product_id }).update({
    quantity: newQty,
    updated_at: db.fn.now(), // Thống nhất dùng db
  });

  await db("inventory_logs").insert({
    inventory_id: inventory.id,
    product_id,
    action: "export",
    reference_id,
    quantity_before: inventory.quantity,
    quantity_change: -amount,
    quantity_after: newQty,
    note: "Order export stock",
    created_at: db.fn.now(), // Thống nhất dùng db
  });

  await db("products")
    .where({ id: product_id })
    .update({ is_available: newQty > 0 });

  return { quantity: newQty };
};

// INCREASE STOCK
exports.increaseStock = async (
  trx,
  product_id,
  amount,
  reference_id = null,
) => {
  const db = trx || knex;

  const inventory = await db("inventory")
    .where({ product_id })
    .forUpdate()
    .first();

  if (!inventory) throw new Error("Inventory not found");
  if (amount <= 0) throw new Error("Invalid amount");

  const newQty = inventory.quantity + amount;

  await db("inventory").where({ product_id }).update({
    quantity: newQty,
    updated_at: db.fn.now(), // Thống nhất dùng db
  });

  await db("inventory_logs").insert({
    inventory_id: inventory.id,
    product_id,
    action: "import",
    reference_id,
    quantity_before: inventory.quantity,
    quantity_change: amount,
    quantity_after: newQty,
    note: "Stock increase",
    created_at: db.fn.now(), // Thống nhất dùng db
  });

  await db("products")
    .where({ id: product_id })
    .update({ is_available: newQty > 0 });

  return { quantity: newQty };
};

// DELETE INVENTORY (SOFT DELETE)
exports.deleteInventory = async (id, created_by = null) => {
  return await knex.transaction(async (trx) => {
    const inventory = await trx("inventory").where({ id }).forUpdate().first();

    if (!inventory) return null;

    await trx("inventory_logs").insert({
      inventory_id: id,
      product_id: inventory.product_id,
      action: "delete",
      reference_id: id,
      quantity_before: inventory.quantity,
      quantity_change: -inventory.quantity,
      quantity_after: 0,
      note: "Soft delete inventory",
      created_by,
      created_at: trx.fn.now(),
    });

    await trx("inventory").where({ id }).update({
      status: "archived",
      deleted_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });

    await trx("products").where({ id: inventory.product_id }).update({
      is_available: false,
    });

    return true;
  });
};

// GET LOW STOCK
exports.getLowStockItems = async () => {
  return await knex("inventory as i")
    .leftJoin("products as p", "i.product_id", "p.id")
    .select(
      "i.id",
      "i.product_id",
      "p.name as product_name",
      "i.quantity",
      "i.min_quantity",
    )
    .where("i.status", "active")
    .andWhereRaw("i.quantity <= i.min_quantity");
};

// GET INVENTORY BY PRODUCT ID
exports.getInventoryByProductId = async (product_id) => {
  return await knex("inventory as i")
    .leftJoin("products as p", "i.product_id", "p.id")
    .select(
      "i.id",
      "i.product_id",
      "p.name as product_name",
      "p.is_available",
      "i.quantity",
      "i.min_quantity",
      "i.status",
      "i.updated_at",
    )
    .where("i.product_id", product_id)
    .first();
};
