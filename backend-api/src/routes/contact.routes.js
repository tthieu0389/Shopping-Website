const express = require("express");
const router = express.Router();

const contactController = require("../controller/contact.controller");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");
const validate = require("../middlewares/validate");

const { createContactSchema } = require("../schema/contact.schema");

// USER SEND CONTACT
router.post("/", validate(createContactSchema), contactController.create);

// ADMIN GET ALL CONTACTS
router.get("/", verifyToken, checkRole("admin"), contactController.getAll);

// ADMIN DELETE CONTACT
router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  contactController.remove,
);

module.exports = router;
