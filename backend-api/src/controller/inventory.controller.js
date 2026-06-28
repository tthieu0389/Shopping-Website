const inventoryService = require("../services/inventory.service");

// CREATE INVENTORY
exports.createInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.createInventory(req.body);
    res.status(201).json({
      message: "Inventory created",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET ALL
exports.getAllInventory = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };
    const result = await inventoryService.getAllInventory({ limit, offset });
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
    const result = await inventoryService.deleteInventory(req.params.id);
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
