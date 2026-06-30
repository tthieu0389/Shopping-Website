const userService = require("../services/user.service");

exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ message: "User created", data: user });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    // Ưu tiên lấy 'q', nếu không có thì lấy 'search'
    const searchQuery = req.query.q || req.query.search;
    const search = searchQuery?.trim() || undefined;

    const result = await userService.getAllUsers({ limit, offset, search });
    res.json({ data: result.data, total: result.total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ message: "User updated", data: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};
