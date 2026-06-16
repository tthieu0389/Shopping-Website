const inventoryLogService = require("../services/inventorylog.service");

//GET ALL LOGS
exports.getAllInventoryLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    const logs = await inventoryLogService.getAllInventoryLogs({
      limit,
      offset,
    });

    res.json({ data: logs, page, limit });
  } catch (err) {
    next(err);
  }
};

//GET BY INVENTORY ID
exports.getLogsByInventoryId = async (req, res, next) => {
  try {
    const logs = await inventoryLogService.getLogsByInventoryId(
      req.params.inventory_id,
    );

    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
};

//GET BY PRODUCT ID
exports.getLogsByProductId = async (req, res, next) => {
  try {
    const logs = await inventoryLogService.getLogsByProductId(
      req.params.product_id,
    );

    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
};
