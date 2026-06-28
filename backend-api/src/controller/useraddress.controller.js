const userAddressService = require("../services/useraddress.service");

exports.createAddress = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      user_id: req.user.id,
    };
    const address = await userAddressService.createAddress(data);
    res.status(201).json({ message: "Address created", data: address });
  } catch (err) {
    next(err);
  }
};

exports.getAddressesByUserId = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
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
      req.user.id, // ← ownership check
      req.body,
    );
    res.json({ message: "Address updated", data: address });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    await userAddressService.deleteAddress(req.params.id, req.user.id);
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
};

exports.setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id);
    const address = await userAddressService.setDefaultAddress(
      userId,
      addressId,
    );
    if (!address) {
      return res.status(404).json({ message: "Địa chỉ không tồn tại" });
    }
    res.json({ message: "Đặt địa chỉ mặc định thành công", data: address });
  } catch (err) {
    next(err);
  }
};
