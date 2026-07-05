const storeService = require("../services/store.service");

// Create a new store
exports.createStore = async (req, res, next) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({ data: store });
  } catch (err) {
    next(err);
  }
};

// Get all stores
exports.getAllStores = async (req, res, next) => {
  try {
    const data = await storeService.getAllStores({
      search: req.query.q || req.query.search,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Update store details
exports.updateStore = async (req, res, next) => {
  try {
    const store = await storeService.updateStore(req.params.id, req.body);
    res.json({ data: store });
  } catch (err) {
    next(err);
  }
};

// Delete store
exports.deleteStore = async (req, res, next) => {
  try {
    await storeService.deleteStore(req.params.id);
    res.json({ message: "Store deleted" });
  } catch (err) {
    next(err);
  }
};
