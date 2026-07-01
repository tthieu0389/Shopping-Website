const express = require("express");
const router = express.Router();

const contactController = require("../controller/contact.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");

const {
  createContactSchema,
  replyContactSchema,
} = require("../schema/contact.schema");

// GỬI LIÊN HỆ
router.post(
  "/",
  verifyToken({ optional: true }),
  validate(createContactSchema),
  contactController.create,
);

// USER XEM LẠI LIÊN HỆ CỦA CHÍNH MÌNH
router.get("/mine", verifyToken(), contactController.getMine);

// ADMIN/STAFF XEM TẤT CẢ LIÊN HỆ
router.get(
  "/",
  verifyToken(),
  checkRole("admin", "staff"),
  contactController.getAll,
);

// ADMIN/STAFF XEM LIÊN HỆ THEO ĐƠN HÀNG
router.get(
  "/order/:orderId",
  verifyToken(),
  checkRole("admin", "staff"),
  contactController.getByOrder,
);

// ADMIN/STAFF XEM CHI TIẾT 1 LIÊN HỆ (Đã bổ sung)
router.get(
  "/:id",
  verifyToken(),
  checkRole("admin", "staff"),
  contactController.getOne,
);

// ADMIN/STAFF PHẢN HỒI LIÊN HỆ
router.patch(
  "/:id/reply",
  verifyToken(),
  checkRole("admin", "staff"),
  validate(replyContactSchema),
  contactController.reply,
);

// ADMIN DELETE CONTACT
router.delete(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  contactController.remove,
);

module.exports = router;
