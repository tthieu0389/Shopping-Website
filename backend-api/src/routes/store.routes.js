const express = require("express");
const router = express.Router();

const controller = require("../controller/store.controller");
const validate = require("../middlewares/validate");
const verifyToken = require("../middlewares/verifyToken");
const checkRole = require("../middlewares/checkRole");

const {
  createStoreSchema,
  updateStoreSchema,
} = require("../schema/store.schema");

router.get("/", controller.getAllStores);

router.post(
  "/",
  verifyToken(),
  checkRole("admin"),
  validate(createStoreSchema),
  controller.createStore,
);

router.put(
  "/:id",
  verifyToken(),
  checkRole("admin"),
  validate(updateStoreSchema),
  controller.updateStore,
);

router.delete("/:id", verifyToken(), checkRole("admin"), controller.deleteStore);

module.exports = router;
