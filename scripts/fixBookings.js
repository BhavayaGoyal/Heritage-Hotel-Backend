// scripts/fixBookings.js
const { getDB, connectDB, closeDB } = require("../database/db");

(async () => {
  try {
    await connectDB();
    const db = getDB();
    const bookings = db.collection("bookings");

    const allBookings = await bookings.find().toArray();

    for (const booking of allBookings) {
      // Build the new structure
      const updatedBooking = {
        ...booking,
        serviceCategory: booking.serviceCategory || "room", // default if missing
        bookingDate: booking.date || booking.bookingDate || new Date().toISOString().split("T")[0],
        bookingTime: booking.time || booking.bookingTime || "18:00",
        status: booking.status?.toLowerCase() || "confirmed",
        numberOfGuests: booking.numberOfGuests || 0,
        details: booking.details || {
          eventName: "",
          durationDays: 1,
          specialRequest: ""
        },
        createdAt: booking.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Remove old redundant fields
      delete updatedBooking.date;
      delete updatedBooking.time;

      // Update in DB
      await bookings.updateOne(
        { _id: booking._id },
        { $set: updatedBooking }
      );
    }

    console.log("✅ All booking documents updated successfully!");
  } catch (error) {
    console.error("❌ Error updating bookings:", error);
  } finally {
    
    process.exit();
  }
})();
