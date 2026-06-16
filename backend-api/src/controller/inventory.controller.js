const inventoryService = require("../services/inventory.service");

/**
 * CREATE INVENTORY
 */
exports.createInventory = async (req, res) => {
  try {
    const result = await inventoryService.createInventory(req.body);

    res.status(201).json({
      message: "Inventory created",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/**
 * GET ALL
 */
exports.getAllInventory = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    const result = await inventoryService.getAllInventory({
      limit,
      offset,
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

/**
 * UPDATE
 */
exports.updateInventory = async (req, res) => {
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
    res.status(400).json({
      message: err.message,
    });
  }
};

/**
 * DELETE
 */
exports.deleteInventory = async (req, res) => {
  try {
    const result = await inventoryService.deleteInventory(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res.json({ message: "Inventory archived" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * LOW STOCK
 */
exports.getLowStockItems = async (req, res, next) => {
  try {
    const data = await inventoryService.getLowStockItems();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

/**
 * DECREASE STOCK
 */
exports.decreaseStock = async (req, res) => {
  try {
    const { product_id, amount } = req.body;

    if (!product_id || amount <= 0) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const result = await inventoryService.decreaseStock(product_id, amount);

    res.json({
      message: "Stock decreased",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/**
 * INCREASE STOCK
 */
exports.increaseStock = async (req, res) => {
  try {
    const { product_id, amount } = req.body;

    if (!product_id || amount <= 0) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const result = await inventoryService.increaseStock(product_id, amount);

    res.json({
      message: "Stock increased",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
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
