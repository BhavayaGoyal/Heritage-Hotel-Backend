const {ObjectId} = require("mongodb");
const {getDB} = require("../database/db");

async function generateBookingId() {
  const db = getDB();
  const bookings = db.collection("bookings");

  const lastBooking = await bookings.find({ _id: { $regex: /^book_\d+$/ } })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();

  if (lastBooking.length === 0 || !lastBooking[0]._id) {
    return "book_041"; 
  }

  const lastIdNum = parseInt(lastBooking[0]._id.split("_")[1]);
  const newIdNum = lastIdNum + 1;

  const newIdStr = String(newIdNum).padStart(3, "0");  
  return `book_${newIdStr}`;
}

const createBooking = async (req, res) => {
  try {
    const db = getDB();
    const { serviceCategory, serviceId, bookingDate, bookingTime, numberOfGuests } = req.body;
    const role = req.user?.role;
    const userId = req.user?.id;

    // Role check
    if (role === "customer" && req.body.customerId && req.body.customerId !== userId) {
      return res.status(403).json({ error: "Customers can only create their own bookings" });
    }

    // Availability check
    let isAvailable = false;
    if (serviceCategory === "hall") {
      isAvailable = await checkHallAvailability(serviceId, bookingDate, bookingTime);
    } else if (serviceCategory === "restaurant") {
      isAvailable = await checkRestaurantAvailability(serviceId, bookingDate, bookingTime, numberOfGuests);
    } else if (serviceCategory === "room") {
      isAvailable = await checkRoomAvailability(serviceId, bookingDate, bookingTime);
    }

    if (!isAvailable) return res.status(400).json({ error: `${serviceCategory} not available at this time` });

    // Generate booking
    const bookingId = await generateBookingId();
    const bookingDoc = {
      _id: bookingId,
      customerId: new ObjectId(role === "customer" ? userId : req.body.customerId),
      serviceCategory,
      serviceId,
      bookingDate,
      bookingTime,
      numberOfGuests: numberOfGuests || 1,
      status: req.body.status || "confirmed",
      details: {
        eventName: req.body.details?.eventName || "",
        durationDays: req.body.details?.durationDays || 1,
        specialRequest: req.body.details?.specialRequest || ""
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("bookings").insertOne(bookingDoc);

    res.status(201).json({ message: "Booking created successfully", bookingId, data: bookingDoc });

  } catch (error) {
    console.error("Error in createBooking:", error);
    res.status(500).json({ error: error.message || "Something went wrong while creating booking" });
  }
};

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
    const { customerId } = req.params;

    if (!ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: "Invalid customerId" });
    }

    const bookings = await db.collection("bookings")
      .find({ customerId: new ObjectId(customerId) })
      .toArray();

    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this customer" });
    }


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

const getAllBookingsWithDetails = async (req, res ) => {
    try {
        const db = getDB();
        const bookings = db.collection("bookings");

        const result = await bookings.aggregate([
            // join customer
            {
                $lookup:{
                    from:"customers",
                    localField: "customerId",
                    foreignField: "userId",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },

            // join rooms
            {
                $lookup: {
                   from: "rooms",
                   localField: "serviceId",
                   foreignField: "roomid",
                   as: "roomDetails"
                }
            },

            // join restaurants
            {
                $lookup:{
                    from: "restaurants",
                    localField: "serviceId",
                    foreignField: "_id",
                    as: "restaurantDetails" 
                }
            },

            // join halls
            {
                $lookup:{
                    from: "halls",
                    localField: "serviceId",
                    foreignField: "hallId",
                    as: "hallDetails"
                }
            },

            // join extra services
            {
                $lookup:{
                    from:"services",
                    localField:"serviceId",
                    foreignField:"_id",
                    as:"extraServiceDetails"
                }
            },

            // merge into one field
            {
                $addFields: {
                    serviceDetails: {
                        $first: {
                            $concatArrays: [
                                "$roomDetails",
                                "$restaurantDetails",
                                "$hallDetails",
                                "$extraServiceDetails"
                            ]
                        }
                    }
                }
            },

            // cleanup
            {
                $project: {
                    roomDetails: 0,
                    restaurantDetails: 0,
                    hallDetails: 0,
                    extraServiceDetails: 0
                }
            }
        ]).toArray();

        res.json({success: true, bookings: result});
    } catch (error) {
        console.error("Error in getAllBookingsWithDetails: ", error);
        res.status(500).json({success: false, message:"Internal server error"});
    }
};


const getMyBookings = async (req, res) => {
    try{
        const db = getDB();
        const bookings = db.collection("bookings");
        const userId = new ObjectId(req.user.userId);

        const result = await bookings.aggregate([
            {$match: {customerId: userId}},
            
            {
                $lookup:{
                    from:"customers",
                    localField:"customerId",
                    foreignField:"userId",
                    as:"customer"
                }
            },
            {$unwind:"$customers"},

            {
                $lookup:{
                    from:{
                        $switch:{
                            branches:[
                               { case: { $eq: ["$serviceCategory", "room"] }, then: "rooms" },
                               { case: { $eq: ["$serviceCategory", "hall"] }, then: "halls" },
                               { case: { $eq: ["$serviceCategory", "restaurant"] }, then: "restaurants" },
                               { case: { $eq: ["$serviceCategory", "service"] }, then: "services" } 
                            ],
                            default:"sevices"
                        }
                    },
                    localField:"serviceId",
                    foreignField:"_id",
                    as:"serviceDetails"
                }
            },
            {$unwind: {path:"$serviceDetails", preserveNullAndEmptyArrays: true}}
        ]).toArray();

        res.json({success: true, bookings: result});
    }catch(error){
        console.error("Error in getMyBookings: ", error);
        res.status(500).json({success: false, message:"Internal server error"});
    }
};

module.exports = {createBooking, getAllBookings, getBookingById, deletingBooking, getBookingsByCustomer,updateBooking, getAllBookingsWithDetails, getMyBookings};

