const express = require("express");
const { createHall, getAllHalls, getHallById, updateHall, deleteHall } = require("../controllers/hallController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", verifyToken, verifyRole("admin", "staff"), createHall);
router.put("/updateHall/:hallId", verifyToken, verifyRole("admin", "staff"), updateHall);
router.delete("/deleteHall/:hallId", verifyToken, verifyRole("admin", "staff"), deleteHall);
router.get("/getAllHalls", getAllHalls);
router.get("/getById/:hallId", getHallById);

module.exports = router;
