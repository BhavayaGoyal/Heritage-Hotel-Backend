const express = require("express");
const router = express.Router();
const {createBooking, getAllBookings, getBookingById, deletingBooking, getBookingsByCustomer, updateBooking, getMyBookings} = require("../controllers/bookingController");
const {validateCreateBooking, validateUpdateBooking} = require("../validators/bookingValidator");
const {verifyToken, authorizeRoles, verifyRole} = require("../middleware/authMiddleware");

router.post(
    "/create",
    verifyToken,
    authorizeRoles("customer"),
    (req, res, next) => {
        const {error} = validateCreateBooking(req.body);
        if(error) {
            return res.status(400).json({errors: error.details.map(err => err.message)});
        }
        next();
    },
    createBooking
);

router.get(
    "/all",
    verifyToken,
    authorizeRoles("admin", "staff"),
    getAllBookings
);

router.get(
    "/:bookingId",
    verifyToken,
    authorizeRoles("admin", "staff"),
    getBookingById
);

router.get(
    "/customer/:customerId",
    verifyToken,
    authorizeRoles("admin", "staff", "customer"),
    getBookingsByCustomer
);

router.put(
    "/update/:bookingId",
    verifyToken,
    authorizeRoles("admin", "staff", "customer"),
    (req, res, next) => {
        const {error} = validateUpdateBooking(req.body);
        if(error) {
            return res.status(400).json({errors: error.details.map(err => err.message)});
        }
        next();
    },
    updateBooking
);

router.delete(
    "/delete/:bookingId",
    verifyToken,
    authorizeRoles("admin","staff"),
    deletingBooking
);

router.get(
    "/all",
    verifyToken,
    verifyRole("admin","staff"),
    getAllBookings
);

router.get(
    "/my",
    verifyToken,
    verifyRole("customer"),
    getMyBookings
);

module.exports = router;