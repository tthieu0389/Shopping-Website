const userService = require("../services/user.service");

const isValidId = (id) => /^\d+$/.test(id);

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

    const searchQuery = req.query.q || req.query.search;
    const search = searchQuery?.trim() || undefined;
    const role = req.query.role?.trim() || undefined;

    const result = await userService.getAllUsers({
      limit,
      offset,
      search,
      role,
    });
    res.json({ data: result.data, total: result.total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Id không hợp lệ" });
    }
    // req.user.id lấy từ verifyToken — cần để service chặn tự đổi role
    // của chính mình / hạ quyền admin cuối cùng.
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user.id,
    );
    res.json({ message: "User updated", data: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Id không hợp lệ" });
    }
    // req.user.id lấy từ verifyToken — cần để service chặn tự xoá chính
    // mình / xoá admin cuối cùng.
    await userService.deleteUser(req.params.id, req.user.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};
