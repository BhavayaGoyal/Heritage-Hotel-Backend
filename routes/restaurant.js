const express = require("express");
const router = express.Router();
const {createRestaurant, getAllRestaurants, getRestaurantById, updateRestaurant, deleteRestaurant} = require("../controllers/restaurantController");

const {verifyToken, verifyRole} = require("../middleware/authMiddleware");

router.post("/create", verifyToken, verifyRole("admin","staff"), createRestaurant);

router.put("/update/:id", verifyToken,verifyRole("admin","staff"), updateRestaurant);

router.delete("/delete/:id", verifyToken,verifyRole("admin","staff"), deleteRestaurant);

router.get("/all", getAllRestaurants);

router.get("/:id", getRestaurantById);

module.exports = router;