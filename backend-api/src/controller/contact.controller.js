const service = require("../services/contact.service");

exports.create = async (req, res, next) => {
  try {
    const data = await service.createContact(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getContacts();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteContact(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
