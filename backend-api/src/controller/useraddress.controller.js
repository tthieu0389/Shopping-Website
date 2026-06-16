const userAddressService = require("../services/useraddress.service");

exports.createAddress = async (req, res, next) => {
  try {
    const address = await userAddressService.createAddress(req.body);
    res.status(201).json({ message: "Address created", data: address });
  } catch (err) {
    next(err);
  }
};

exports.getAddressesByUserId = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const addresses = await userAddressService.getAddressesByUserId(userId);
    res.json({ data: addresses });
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const address = await userAddressService.updateAddress(
      req.params.id,
      req.body,
    );
    res.json({ message: "Address updated", data: address });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    await userAddressService.deleteAddress(req.params.id);
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
};
