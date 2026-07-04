const inventoryService = require("../services/inventory.service");

// CREATE INVENTORY
exports.createInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.createInventory(
      req.body,
      req.user?.id,
    );
    res.status(201).json({
      message: "Inventory created",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET ALL
// GET ALL
exports.getAllInventory = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };
    // Chấp nhận cả 2 tên query param: q (frontend hiện đang dùng) và search
    // (để tương thích nếu chỗ khác gọi bằng tên khác) — ưu tiên q nếu có cả 2.
    const keyword = (req.query.q || req.query.search || "").trim() || undefined;

    // Lọc theo status ("active" | "inactive"), không truyền thì lấy cả hai
    const status = req.query.status;

    const result = await inventoryService.getAllInventory({
      limit,
      offset,
      keyword,
      status,
    });
    res.json({
      data: result.data,
      page,
      limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE
exports.updateInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.updateInventory(
      req.params.id,
      req.body,
      req.user?.id,
    );
    if (!result) {
      return res.status(404).json({ message: "Inventory not found" });
    }
    res.json({
      message: "Inventory updated",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.deleteInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.deleteInventory(
      req.params.id,
      req.user?.id,
    );
    if (!result) {
      return res.status(404).json({ message: "Inventory not found" });
    }
    res.json({ message: "Inventory archived" });
  } catch (err) {
    next(err);
  }
};

// GET LOW STOCK
exports.getLowStockItems = async (req, res, next) => {
  try {
    const data = await inventoryService.getLowStockItems();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.getInventoryByProductId = async (req, res, next) => {
  try {
    const data = await inventoryService.getInventoryByProductId(
      req.params.product_id,
    );
    if (!data) {
      return res.status(404).json({ message: "Inventory not found" });
    }
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
