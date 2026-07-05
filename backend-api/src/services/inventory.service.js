const knex = require("../database/knex");
const { normalizeKeyword } = require("../utils/searchKeyword");

// Kiểm tra sản phẩm có đơn hàng nào chưa xử lý xong (pending/confirmed/shipping)
// hay không — dùng để chặn việc khoá/archive tồn kho giữa chừng khi còn đơn
// đang chờ giao, tránh trường hợp huỷ đơn sau này không hoàn kho được đúng ý,
// hoặc đơn confirmed/shipping rồi mà sản phẩm lại biến mất khỏi hệ thống quản lý.
const hasUnresolvedOrders = async (trx, product_id) => {
  const row = await trx("order_items as oi")
    .join("orders as o", "oi.order_id", "o.id")
    .where("oi.product_id", product_id)
    .whereIn("o.status", ["pending", "confirmed", "shipping"])
    .first();
  return !!row;
};

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
exports.getAllInventory = async ({ limit, offset, search, status }) => {
  const baseQuery = () => {
    const q = knex("inventory as i").leftJoin(
      "products as p",
      "i.product_id",
      "p.id",
    );

    if (status && ["active", "inactive"].includes(status)) {
      q.where("i.status", status);
    } else {
      q.whereIn("i.status", ["active", "inactive"]);
    }

    // Tìm theo tên sản phẩm (q hoặc search từ controller gộp lại thành search)
    const kw = normalizeKeyword(search);
    if (kw) {
      q.andWhere("p.name", "ilike", `%${kw}%`);
    }
    return q;
  };

  const data = await baseQuery()
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
    // Đẩy các dòng hết hàng (quantity = 0) xuống cuối danh sách
    .orderByRaw("CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END ASC")
    .orderBy("i.id", "desc")
    .limit(limit)
    .offset(offset);

  const [totalRow] = await baseQuery().count("i.id as count");
  return { data, total: Number(totalRow.count) };
};

// UPDATE INVENTORY (ADJUST)
exports.updateInventory = async (id, data, created_by = null) => {
  return await knex.transaction(async (trx) => {
    const old = await trx("inventory").where({ id }).forUpdate().first();
    if (!old) return null;

    // Chặn khoá/archive tồn kho nếu đang chuyển từ active sang
    // inactive/archived mà sản phẩm còn đơn hàng chưa xử lý xong (pending/
    // confirmed/shipping) — tránh vướng khi huỷ đơn cần hoàn kho, hoặc đơn
    // đang giao mà sản phẩm bị coi như ngừng quản lý giữa chừng.
    if (
      data.status !== undefined &&
      data.status !== "active" &&
      old.status === "active"
    ) {
      const blocked = await hasUnresolvedOrders(trx, old.product_id);
      if (blocked) {
        const err = new Error(
          "Không thể khoá/xoá tồn kho khi sản phẩm còn đơn hàng chưa xử lý xong (pending/confirmed/shipping).",
        );
        err.statusCode = 409;
        throw err;
      }
    }

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

    // Sản phẩm chỉ được coi là còn bán khi dòng tồn kho đang active VÀ còn
    // số lượng. Nếu inventory đang inactive/archived thì is_available luôn
    // là false, bất kể quantity là bao nhiêu — tránh trường hợp sửa quantity
    // của 1 dòng đã bị archived/inactive lại vô tình làm sản phẩm hiện lại.
    const finalStatus = updated.status;
    await trx("products")
      .where({ id: old.product_id })
      .update({
        is_available:
          finalStatus === "active" && (updated.quantity ?? old.quantity) > 0,
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

  if (!inventory) {
    const err = new Error("Không tìm thấy thông tin tồn kho cho sản phẩm này");
    err.statusCode = 404;
    throw err;
  }
  if (inventory.status !== "active") {
    const err = new Error(
      "Sản phẩm này hiện đã ngừng kinh doanh, không thể đặt hàng",
    );
    err.statusCode = 400;
    throw err;
  }
  if (amount <= 0) {
    const err = new Error("Số lượng không hợp lệ");
    err.statusCode = 400;
    throw err;
  }
  if (inventory.quantity < amount) {
    const err = new Error(
      `Sản phẩm không đủ số lượng (còn ${inventory.quantity}, cần ${amount})`,
    );
    err.statusCode = 400;
    throw err;
  }

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

  if (!inventory) {
    const err = new Error("Không tìm thấy thông tin tồn kho cho sản phẩm này");
    err.statusCode = 404;
    throw err;
  }
  if (amount <= 0) {
    const err = new Error("Số lượng không hợp lệ");
    err.statusCode = 400;
    throw err;
  }

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

  // Nếu dòng kho đang inactive/archived (bị khoá sau khi đơn được đặt), hoàn
  // kho không có nghĩa là "mở bán lại" — is_available vẫn phải là false cho
  // tới khi ai đó chủ động set status về active, đúng invariant ở updateInventory.
  await db("products")
    .where({ id: product_id })
    .update({ is_available: inventory.status === "active" && newQty > 0 });

  return { quantity: newQty };
};

// DELETE INVENTORY (SOFT DELETE)
exports.deleteInventory = async (id, created_by = null) => {
  return await knex.transaction(async (trx) => {
    const inventory = await trx("inventory").where({ id }).forUpdate().first();

    if (!inventory) return null;

    const blocked = await hasUnresolvedOrders(trx, inventory.product_id);
    if (blocked) {
      const err = new Error(
        "Không thể xoá tồn kho khi sản phẩm còn đơn hàng chưa xử lý xong (pending/confirmed/shipping).",
      );
      err.statusCode = 409;
      throw err;
    }

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
