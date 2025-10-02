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
        const db= getDB();
        const paymentId = await generatePaymentId();

        const {bookingId, customerId, roomIds = [], hallIds = [], serviceIds = [], restaurantIds = [], paymentMethod} = req.body;

        const payments = db.collection("payments");
        const bookings = db.collection("bookings");
        const customers = db.collection("customers");
        const rooms = db.collection("rooms");
        const halls = db.collection("halls");
        const services = db.collection("services");
        const restaurants = db.collection("restaurants");

        const booking = await bookings.findOne({_id: new ObjectId(bookingId)});
        if(!booking) return res.status(404).json({error:"Booking Not Found!"});

        const customer = await customers.findOne({_id: new ObjectId(customerId)});
        if(!customer) return res.status(404).json({error: "customer not found!"});

        let totalAmount = 0;

        if(roomIds.length > 0){
            const selectedRooms = await rooms.find({_id: {$in: roomIds.map(id => new ObjectId(id))}}).toArray();
            totalAmount+= selectedRooms.reduce((sum, r) => sum+(r.price || 0), 0);
        }

        if(hallIds.length > 0){
            const selectedHalls = await halls.find({_id: {$in: hallIds.map(id => new ObjectId(id))}}).toArray();
            totalAmount+= selectedHalls.reduce((sum, h) => sum+(h.price || 0), 0)
        }

        if(restaurantIds.length > 0){
            const selectedRestaurants = await restaurants.find({_id: {$in: restaurantIds.map(id => new ObjectId(id))}}).toArray();
            totalAmount+= selectedRestaurants.reduce((sum, r)=> sum+(r.price || 0), 0);
        }

        if(serviceIds.length > 0){
            const selectedServices = await services.find({_id: {$in: serviceIds.map(id => new ObjectId(id))}}).toArray();
            totalAmount+= selectedServices.reduce((sum, s) => sum+(s.price || 0), 0);
        }

        const newPayment = {
            paymentId,
            bookingId: new ObjectId(bookingId),
            customerId: new ObjectId(customerId),
            roomIds: roomIds.map(id => new ObjectId(id)),
            hallIds: hallIds.map(id => new ObjectId(id)),
            serviceIds: serviceIds.map(id => new ObjectId(id)),
            restaurantIds: restaurantIds.map(id => new ObjectId(id)),
            totalAmount,
            paymentMethod,
            status: "paid",
            createdAt: new Date(),
        };

        const result = await payments.insertOne(newPayment);
        res.status(201).json({message: "Payment created successfully", payment: newPayment});
    } catch (error) {
        console.error("Error creating payment: ", error);
        res.status(500).json({error: "Internal Server Error"});
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
        const customerId = req.user.role === "customer" ? req.user.id: req.params.customerId;

        const payments = await db.collection("payments").find({customerId: new ObjectId(customerId )}).toArray();
        res.json(payments);
    } catch (error) {
        console.error("Error fetching customer payments:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updatePayment = async(req, res) => {
    try {
        const db = getDB();
        const payments = db.collection("payments");

        const updatedPayment = await payments.findOneAndUpdate(
            {paymentId: req.params.paymentId},
            {$set: {...req.body, updatedAt: new Date()}},
            {returnDocument: "after"}
        );

        if(!updatedPayment.value) return res.status(404).json({error: "payment not found"});
        res.json(updatedPayment.value);

    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const deletePayment = async (req, res) => {
    try {
        const db = getDB();
        const payments = db.collection("payments");

        const deleted = await payments.findOneAndDelete({paymentId: req.params.paymentId});
        if(!deleted.value) return res.status(404).json({error: "payment not found"});

        res.json({message:"Payment deleted"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

module.exports= {createPayment, getAllPayments, getCustomerPayments, updatePayment, deletePayment};