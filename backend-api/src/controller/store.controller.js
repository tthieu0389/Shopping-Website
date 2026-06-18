const storeService = require("../services/store.service");

// Create a new store
exports.createStore = async (req, res, next) => {
  try {
    // Keep original body data and append userId from token if not provided
    const data = {
      ...req.body,
      user_id: req.body.user_id || req.user.id,
    };

    const store = await storeService.createStore(data);
    res.status(201).json({ data: store });
  } catch (err) {
    next(err);
  }
};

// Get all stores
exports.getAllStores = async (req, res, next) => {
  try {
    const data = await storeService.getAllStores();
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
