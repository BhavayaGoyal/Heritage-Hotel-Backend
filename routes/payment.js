const express = require("express");
const router = express.Router();
const {createPayment, getAllPayments, getCustomerPayments, updatePayment, deletePayment} = require("../controllers/paymentController");
const {paymentSchema, paymentUpdateSchema} = require("../validators/paymentValidator");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/createPayment", verifyToken, async(req, res, next) => {
    const {error} = paymentSchema.validate(req.body);
    if(error) return res.status(400).json({errors: error.details.map(e => e.message)});
    next();
}, createPayment);

router.get("/getAllPayments", verifyToken, authorizeRoles("admin", "staff"), getAllPayments);

router.get("/getCustomerPayments/:paymentId", verifyToken, getCustomerPayments);
    
router.put("/updatePayments/:paymentId", verifyToken,authorizeRoles("admin","staff"), async(req, res, next) => {
    const {error} = paymentUpdateSchema.validate(req.body, {allowUnknown: true});
    if(error) return res.status(400).json({errors: error.details.map(e => e.message) });
    next();
}, updatePayment);
router.delete("/removePayment/:paymentId", verifyToken, authorizeRoles("admin"), deletePayment);

module.exports = router;