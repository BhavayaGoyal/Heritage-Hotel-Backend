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
    const { bookingId, roomIds = [], hallIds = [], serviceIds = [], restaurantIds = [], paymentMethod, promoCode } = req.body;

    const bookings = db.collection("bookings");
    const customers = db.collection("customers");
    const rooms = db.collection("rooms");
    const halls = db.collection("halls");
    const services = db.collection("services");
    const restaurants = db.collection("restaurants");
    const payments = db.collection("payments");
    const promotions = db.collection("promotions");

    const booking = await bookings.findOne({ _id: bookingId });
    if (!booking) return res.status(404).json({ error: "Booking not found!" });

    let customer;
    const { customerId } = req.body;
    if (req.user?.id) {
      customer = await customers.findOne({ userId: new ObjectId(req.user.id) });
    } else if (customerId) {
      customer = await customers.findOne({ _id: new ObjectId(customerId) });
    }

    if (!customer) return res.status(404).json({ error: "Customer not found!" });

    const parsePrice = (val) =>{
      if(!val) return 0;
      const num = String(val).replace(/[^\d.]/g, ""); 
      return num ? Number(num) : 0;
    };

    let totalAmount = 0;

    if (roomIds.length > 0) {
      const selectedRooms = await rooms.find({ roomId: { $in: roomIds } }).toArray();
      const roomTotal = selectedRooms.reduce((sum, r) => sum + parsePrice(r.price), 0);
      totalAmount += roomTotal;
    }

    if (hallIds.length > 0) {
      const selectedHalls = await halls.find({ hallId: { $in: hallIds } }).toArray();
      totalAmount += selectedHalls.reduce((sum, h) => sum + parsePrice(h.price || 0), 0);
    }

    if (restaurantIds.length > 0) {
      const selectedRestaurants = await restaurants.find({ restaurantId: { $in: restaurantIds } }).toArray();
      totalAmount += selectedRestaurants.reduce((sum, r) => sum + parsePrice(r.price || 0), 0);
    }

    if (serviceIds.length > 0) {
      const selectedServices = await services.find({ serviceId: { $in: serviceIds } }).toArray();
      totalAmount += selectedServices.reduce((sum, s) => sum + parsePrice(s.price || 0), 0);
    }
    console.log("🧾 Total before promo:", totalAmount);

    let discountApplied = 0;
    let promotionUsed = null;
    let promoMessage = "No promotion applied";

    if(promoCode){
      const currentDate = new Date();
      console.log("Searching promo code:", promoCode, "at", new Date());

      const promoTrimmed = promoCode.trim().toUpperCase();
      const promo = await promotions.findOne({
        promoCode: promoTrimmed,
        status: "active",
        validFrom: {$lte: currentDate},
        validTo: {$gte: currentDate},
      });
      console.log("Found promo:", promo);

      if(promo){
        const allSelectedCategories = [];
        if(roomIds.length>0) allSelectedCategories.push("room");
        if (hallIds.length > 0) allSelectedCategories.push("hall");
        if (serviceIds.length > 0) allSelectedCategories.push("service");
        if (restaurantIds.length > 0) allSelectedCategories.push("restaurant");
        console.log("Promo applicable categories:", promo.applicableCategories);
console.log("All selected categories:", allSelectedCategories);

        const applicable = promo.applicableCategories.some(cat => allSelectedCategories.includes(cat));

        if(applicable){
          console.log(`✅ Promotion applied: ${promo.discountType} ${promo.discountValue}, applicable categories:`, promo.applicableCategories);

          if(promo.discountType === "percentage"){
            discountApplied = (totalAmount*promo.discountValue)/100;
          } else if(promo.discountType === "flat"){
            discountApplied = promo.discountValue;
          }
          totalAmount-=discountApplied;
          promotionUsed= promo._id;
          promoMessage = `Promotion applied. You saved ${discountApplied} Rs.`;
        } else {
          promoMessage = "Promo code is not applicable for selected categories.";
        }
      } else{
        promoMessage = "Invalid or expired promo code";
      }
    }
    const newPayment = {
      paymentId,
      bookingId,
      customerId: customer._id, 
      roomIds,
      hallIds,
      serviceIds,
      restaurantIds,
      totalAmount,
      paymentMethod,
      status: "paid",
      promotionUsed,
      discountApplied,
      promoCode: promotionUsed ? promoCode : null,
      promoMessage,
      createdAt: new Date(),
    };

    const result = await payments.insertOne(newPayment);
    res.status(201).json({ message: "Payment created successfully", payment: {
        ...newPayment,
        totalAmount: `${newPayment.totalAmount} Rs.`,
      }, 
    });

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