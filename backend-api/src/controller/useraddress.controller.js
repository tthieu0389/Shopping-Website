const userAddressService = require("../services/useraddress.service");

// Create a new user address
exports.createAddress = async (req, res, next) => {
  try {
    // Keep your original body data and append userId from token if not provided
    const data = {
      ...req.body,
      user_id: req.body.user_id || req.user.id,
    };

    const address = await userAddressService.createAddress(data);
    res.status(201).json({ message: "Address created", data: address });
  } catch (err) {
    next(err);
  }
};

// Get all addresses by userId
exports.getAddressesByUserId = async (req, res, next) => {
  try {
    // Fallback to token userId if route param is missing
    const userId = req.params.userId || req.user.id;

    const addresses = await userAddressService.getAddressesByUserId(userId);
    res.json({ data: addresses });
  } catch (err) {
    next(err);
  }
};

// Update address
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

// Delete address
exports.deleteAddress = async (req, res, next) => {
  try {
    await userAddressService.deleteAddress(req.params.id);
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
};
