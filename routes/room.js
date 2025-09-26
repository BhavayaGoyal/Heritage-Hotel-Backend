const express = require("express");
const router = express.Router();
const {
  getAllRooms,
  getRoomByid,
  updateRoomAvailability,
} = require("../controllers/roomController");

const { roomAvailabilityValidator } = require("../validators/roomValidator");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  next();
};

router.get("/", getAllRooms);

router.get("/:roomid", getRoomByid);

router.put(
  "/availability",
  verifyToken,
  verifyRole("admin"),
  validate(roomAvailabilityValidator),
  updateRoomAvailability
);

module.exports = router;
