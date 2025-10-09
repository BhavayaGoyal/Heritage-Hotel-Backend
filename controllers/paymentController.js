const {ObjectId} = require('mongodb');
const {getDB} = require("../database/db");

async function generatePaymentId() {
    const db = getDB();
    const payments = db.collection("payments");

    const lastPayment = await payments.find({paymentId: {$regex: /^pay_\d+$/}})
    .sort({paymentId: -1})
    .limit(1)
    .toArray();

    if(lastPayment.length === 0) return "pay_001";

    const lastId = parseInt(lastPayment[0].paymentId.split("_")[1]);
    const newId = (lastId + 1).toString().padStart(3,"0");
    return `pay_${newId}`;
};

const createPayment = async (req, res) => {
  try {
    const db = getDB();
    const paymentId = await generatePaymentId();
    const { bookingId, roomIds = [], hallIds = [], serviceIds = [], restaurantIds = [], paymentMethod } = req.body;

    const bookings = db.collection("bookings");
    const customers = db.collection("customers");
    const rooms = db.collection("rooms");
    const halls = db.collection("halls");
    const services = db.collection("services");
    const restaurants = db.collection("restaurants");
    const payments = db.collection("payments");

    // 1️⃣ Fetch booking
    const booking = await bookings.findOne({ _id: bookingId });
    if (!booking) return res.status(404).json({ error: "Booking not found!" });

    // 2️⃣ Fetch customer linked to logged-in user
    const customer = await customers.findOne({ userId: new ObjectId(req.user.id) });
    if (!customer) return res.status(404).json({ error: "Customer not found!" });

    // 3️⃣ Calculate total amount
    let totalAmount = 0;

    if (roomIds.length > 0) {
      const selectedRooms = await rooms.find({ roomId: { $in: roomIds } }).toArray();
      totalAmount += selectedRooms.reduce((sum, r) => sum + (r.price || 0), 0);
    }

    if (hallIds.length > 0) {
      const selectedHalls = await halls.find({ hallId: { $in: hallIds } }).toArray();
      totalAmount += selectedHalls.reduce((sum, h) => sum + (h.price || 0), 0);
    }

    if (restaurantIds.length > 0) {
      const selectedRestaurants = await restaurants.find({ restaurantId: { $in: restaurantIds } }).toArray();
      totalAmount += selectedRestaurants.reduce((sum, r) => sum + (r.price || 0), 0);
    }

    if (serviceIds.length > 0) {
      const selectedServices = await services.find({ serviceId: { $in: serviceIds } }).toArray();
      totalAmount += selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    }

    // 4️⃣ Create payment
    const newPayment = {
      paymentId,
      bookingId,
      customerId: customer._id, // ✅ correct ObjectId
      roomIds,
      hallIds,
      serviceIds,
      restaurantIds,
      totalAmount,
      paymentMethod,
      status: "paid",
      createdAt: new Date(),
    };

    const result = await payments.insertOne(newPayment);
    res.status(201).json({ message: "Payment created successfully", payment: newPayment });

  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllPayments = async (req, res) => {
    const db = getDB();
    try {
        if(req.user.role!== "admin" && req.user.role !== "staff"){
            return res.status(403).json({error: "Access denied."});
        }

        const payments = await db.collection("payments").find().toArray();
        res.json(payments);

    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getCustomerPayments = async (req, res) => {
  const db = getDB();
  try {
    const { paymentId } = req.params;
    const payments = db.collection("payments");
    const customers = db.collection("customers");

    // 1️⃣ Find payment
    const payment = await payments.findOne({ paymentId });
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    // 2️⃣ Admin/staff access
    if (req.user.role === "admin" || req.user.role === "staff") {
      return res.json(payment);
    }

    // 3️⃣ Customer access
    if (req.user.role === "customer") {
      const customer = await customers.findOne({ userId: new ObjectId(req.user.id) });
      if (!customer) return res.status(404).json({ error: "Customer not found" });

      if (!payment.customerId.equals(customer._id)) {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.json(payment);
    }

    return res.status(403).json({ error: "Access denied" });

  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updatePayment = async (req, res) => {
  try {
    const db = getDB();
    const payments = db.collection("payments");

    const paymentId = req.params.paymentId;
    console.log("Payment ID from params:", paymentId);

    const result = await payments.updateOne(
      { paymentId },
      { $set: { ...req.body, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "payment not found" });
    }

    const updatedPayment = await payments.findOne({ paymentId });

    res.json({
      message: "Payment updated successfully",
      updatedPayment
    });

  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: error.message });
  }
};


const deletePayment = async (req, res) => {
  try {
    const db = getDB();
    const payments = db.collection("payments");

    const paymentId = req.params.paymentId;
    console.log("Deleting payment ID:", paymentId);

    const result = await payments.deleteOne({ paymentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "payment not found" });
    }

    res.json({ message: "Payment deleted successfully" });

  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: error.message });
  }
};


module.exports= {createPayment, getAllPayments, getCustomerPayments, updatePayment, deletePayment};