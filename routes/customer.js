const express = require("express");
const router = express.Router();
const {
  createCustomer,
  getCustomerById,
  getAllCustomers,
  updateCustomer,
  deleteCustomer
} = require("../controllers/customerController");

const { verifyToken, verifyRole, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createCustomer);
router.get("/getAll", verifyToken, getAllCustomers);
router.get("/getCustomer/:id", verifyToken, getCustomerById);
router.put("/updateCustomer/:id", verifyToken, updateCustomer);
router.delete("/removeCustomer/:id", verifyToken, deleteCustomer);

module.exports = router;
