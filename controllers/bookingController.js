const {ObjectId} = require("mongodb");
const db = require("../database/db");

async function generateBookingId() {
    const bookings = db.collection("bookings");

    const lastBooking = await bookings.find().sort({createdAt: -1}).limit(1).toArray();

    if(lastBooking.length === 0){
        return "book_001";
    }

    const lastId = parseInt(lastBooking[0].bookingId.split("_")[1]);
    return `book_${lastId+1}`;
}

// create bookings

const createBooking = async(req, res) => {
    try {
        const booking = req.body;

        const bookingId = await generateBookingId();

        booking._id = bookingId;
        booking.date = new Date(booking.date).toISOString().split("T")[0];
        booking.createdAt = new Date();

        await db.collection("bookings").insertOne(booking);
        res.status(201).json({message: "Booking created ", bookingId});
    } catch (error) {
        console.error("Error while creating booking: ",error);
        res.status(500).json({error: "Failed to create booking."});
    }
};

// get all bookings

 const getAllBookings = async (req, res) => {
    try {
        const bookings = db.collection("bookings");
        const allBookings = await bookings.find().toArray();
        res.json(allBookings);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// get booking by id

const getBookingById = async (req, res) => {
    try {
        const bookings = db.collection("bookings");
        const booking = await bookings.findOne({bookingId: req.params.bookingId});

        if(!booking){
            return res.status(404).json({error:"Booking not found."});
        }

        res.json(booking);

    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// deleting the bookings

const deletingBooking = async (req, res) => {
    try {
        const bookings = db.collection("bookings");
        const result = await bookings.deleteOne({bookingId: req.params.bookingId});

        if(result.deletedCount === 0){
            return res.status(404).json({error:"Booking not found!"});
        }

        res.json({message:"Booking Deleted."})
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const getBookingsByCustomer = async (req, res) => {
    try {
        const {customerId} = req.params;
        const bookings = await db.collection("bookings").find({customerId}).toArray();
        res.json(bookings);

    } catch (error) {
        console.error("Get customer bookings error: ", error);
        res.status(500).json({error:"Failed to fetch customer bookings"});
    }
};

const updateBooking = async (req, res) => {
    try {
        const {id} = req.params;
        const updateData = req.body;

        const res = await db.collection("bookings").updateOne(
            {_id: id},
            {$set: updateData}
        );

        if(res.matchedCOunt === 0){
            return res.status(404).json({error:"Booking not found."})
        }
        
        res.json({message:"Booking updated."});
    } catch (error) {
        console.error("Update Bookings Error: ", err);
        res.status(500).json({error:"Failed to update bookings"});
    }
};

module.exports = {createBooking, getAllBookings, getBookingById, deletingBooking, getBookingsByCustomer,updateBooking};

