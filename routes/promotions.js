// routes/promotionRoutes.js
const express = require("express");
const router = express.Router();
const {
  getActivePromotions,
  getAllPromotions,
  addPromotions,
  updatePromotion,
  deletePromotion,
} = require("../controllers/promotionController");
const { validatePromotion } = require("../validators/promotionValidator");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/active", verifyToken, getActivePromotions);

router.get("/all", verifyToken, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}, getAllPromotions);

router.post("/add", verifyToken, validatePromotion, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}, addPromotions);

router.put("/update/:promotionId", verifyToken, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}, updatePromotion);

router.delete("/delete/:promotionId", verifyToken, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}, deletePromotion);

module.exports = router;
