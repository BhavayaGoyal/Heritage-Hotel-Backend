const {ObjectId} = require("mongodb");
const {getDB} = require("../database/db");

async function generateBookingId() {
  const db = getDB();
  const bookings = db.collection("bookings");

  // find the last booking with bookingId
  const lastBooking = await bookings.find({ _id: { $regex: /^book_\d+$/ } })
    .sort({ _id: -1 }) // sort by _id descending
    .limit(1)
    .toArray();

  if (lastBooking.length === 0 || !lastBooking[0]._id) {
    return "book_041"; // start from 041
  }

  const lastIdNum = parseInt(lastBooking[0]._id.split("_")[1]);
  const newIdNum = lastIdNum + 1;

  const newIdStr = String(newIdNum).padStart(3, "0");  
  return `book_${newIdStr}`;
}



// create bookings

const createBooking = async(req, res) => {
    try {
        const db = getDB();
        const bookings = db.collection("bookings");

        const booking = req.body;
        const bookingId = await generateBookingId();

        const bookingDoc = {
            _id: bookingId,
            customerId: booking.customerId,
            serviceCategory : booking.serviceCategory,
            serviceId : booking.serviceId,
            date: new Date(booking.date).toISOString().split("T")[0],
            time: booking.time,
            status: booking.status || "Confirmed",
            numberOfGuests: booking.numberOfGuests
        };

        await bookings.insertOne(bookingDoc);
        res.status(201).json({message: "Booking created ", bookingId});
    } catch (error) {
        console.error("Error while creating booking: ",error);
        res.status(500).json({error: error.message || "Something went wrong" });
    }
};

// get all bookings

 const getAllBookings = async (req, res) => {
    try {
        const db = getDB();
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
        const db = getDB();
        const bookings = db.collection("bookings");
        const booking = await bookings.findOne({_id: req.params.bookingId});

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
        const db = getDB();
        const bookings = db.collection("bookings");
        const result = await bookings.deleteOne({_id: req.params.bookingId});

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
        const db = getDB();
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
        const db = getDB();
        const {bookingId } = req.params;
        const updateData = req.body;

        const result = await db.collection("bookings").updateOne(
            {_id: bookingId },
            {$set: updateData}
        );

        if(result.matchedCount === 0){
            return res.status(404).json({error:"Booking not found."})
        }
        
        res.json({message:"Booking updated."});
    } catch (error) {
        console.error("Update Bookings Error: ", error);
        res.status(500).json({error:"Failed to update bookings"});
    }
};

module.exports = {createBooking, getAllBookings, getBookingById, deletingBooking, getBookingsByCustomer,updateBooking};

