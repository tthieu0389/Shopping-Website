const service = require("../services/contact.service");

// Gửi liên hệ
exports.create = async (req, res, next) => {
  try {
    const data = await service.createContact(req.body, req.user?.id || null);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

// Admin/Staff xem danh sách tất cả
exports.getAll = async (req, res, next) => {
  try {
    // Chấp nhận cả 2 tên query param: q và search
    const data = await service.getContacts({
      search: req.query.q || req.query.search,
      status: req.query.status,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Admin/Staff xem chi tiết 1 liên hệ
exports.getOne = async (req, res, next) => {
  try {
    const data = await service.getContactById(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Admin/Staff xem các liên hệ liên quan 1 đơn hàng
exports.getByOrder = async (req, res, next) => {
  try {
    const data = await service.getContactsByOrder(req.params.orderId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// User xem lại liên hệ của chính mình
exports.getMine = async (req, res, next) => {
  try {
    const data = await service.getContactsByUser(req.user.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Admin/Staff phản hồi liên hệ
exports.reply = async (req, res, next) => {
  try {
    const data = await service.replyContact(
      req.params.id,
      req.user.id,
      req.body.reply,
    );
    res.json({ message: "Replied", data });
  } catch (err) {
    next(err);
  }
};

// Admin đánh dấu liên hệ đã xử lý (pending -> resolved)
exports.resolve = async (req, res, next) => {
  try {
    const data = await service.resolveContact(req.params.id);
    res.json({ message: "Đã đánh dấu resolved", data });
  } catch (err) {
    next(err);
  }
};

// Xóa liên hệ
exports.remove = async (req, res, next) => {
  try {
    await service.deleteContact(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
