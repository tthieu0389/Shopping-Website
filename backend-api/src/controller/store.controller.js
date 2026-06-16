const storeService = require("../services/store.service");

exports.createStore = async (req, res) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({ data: store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllStores = async (req, res) => {
  const data = await storeService.getAllStores();
  res.json({ data });
};

exports.updateStore = async (req, res) => {
  const store = await storeService.updateStore(req.params.id, req.body);
  res.json({ data: store });
};

exports.deleteStore = async (req, res) => {
  await storeService.deleteStore(req.params.id);
  res.json({ message: "Store deleted" });
};
