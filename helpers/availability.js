const {getDB} = require("../database/db");

const checkHallAvailability = async (req, res) => {
    const db = getDB();
    const hallBookings = await db.collection("bookings")
    .find({serviceCategory: "hall", serviceId: hallId, bookingDate: date, bookingTime: time})
    .toArray();
    return hallBookings.length === 0;
};

const checkRestaurantAvailability = async (restaurantId, date, time, requestedSeats) => {
  const db = getDB();
  const restaurant = await db.collection("restaurants").findOne({ _id: restaurantId });
  if (!restaurant) throw new Error("Restaurant not found");

  const booked = await db.collection("bookings").aggregate([
    { $match: { serviceCategory: "restaurant", serviceId: restaurantId, bookingDate: date, bookingTime: time } },
    { $group: { _id: null, total: { $sum: "$numberOfGuests" } } }
  ]).toArray();

  const seatsBooked = booked[0]?.total || 0;
  return seatsBooked + requestedSeats <= restaurant.capacity;
};

const checkRoomAvailability = async (roomId, date, time) => {
  const db = getDB();
  const roomBookings = await db.collection("bookings")
    .find({ serviceCategory: "room", serviceId: roomId, bookingDate: date, bookingTime: time })
    .toArray();
  return roomBookings.length === 0;
};

module.exports = { checkHallAvailability, checkRestaurantAvailability, checkRoomAvailability };