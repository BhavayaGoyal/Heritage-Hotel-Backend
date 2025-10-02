const { ObjectId } = require("mongodb");
const {getDB} = require("../database/db");
const {validateCustomer, validateUpdateCustomer} = require("../validators/customerValidator");

const createCustomer = async(req, res) => {
    try {
        const userId = req.user.id;

        const db = getDB();
        const customers = db.collection("customers");
        const existing = await customers.findOne({userId: new ObjectId(userId)});

        if(existing){
            return res.status(400).json({error:"Customer profile already exists for this user."});
        }

        const {error} = validateCustomer(req.body);
        if(error){
            return res.status(400).json({errors: error.details.map(d => d.message)});
        }

        const customerDoc = {
            ...req.body,
            userId: new ObjectId(userId),
            createdAt: new Date()
     };
     
        const result = await customers.insertOne(customerDoc);

        res.status(201).json({
            message:"Customer created successfully",
            customerId: result.insertedId
        });
    } catch (error) {
        console.error("Create Customer Error:", error);
    res.status(500).json({ error: "Internal server error" });
    }
};

const getAllCustomers = async (req, res) => {
    try {
        if(!["admin","staff"].includes(req.user.role)){
            return res.status(403).json({error:"Access denied"});
        }

        const db = getDB();
        const customers = await db.collection("customers").find().toArray();
        res.json(customers);

    } catch (error) {
        console.error("Get All Customers Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getCustomerById = async (req, res) => {
    try {
       const db = getDB();
       const customers = db.collection("customers");
       const {id} = req.params;
       
       const customer = await customers.findOne({_id: new ObjectId(id)});
       if(!customer){
        return res.status(404).json({error:"Customer not found."});
       }
        if(
            req.user.role !== "admin" &&
            req.user.role !== "staff" &&
            customer.userId.toString() !== req.user.id
        ){
            return res.status(403).json({error:"Access Denied"});
        }

       res.json(customer);
    } catch (error) {
        console.log("Get Customer error",error);
        res.status(500).json({error:"Internal server error"})
    }
};

const updateCustomer = async (req, res) => {
    try {
        const db = getDB();
        const customers = db.collection("customers");
        const {id} = req.params;

        const customer = await customers.findOne({_id: new ObjectId(id)});
        if(!customer){
            return res.status(404).json({error:"Customer not found!"});
        }

        if(
            req.user.role !=="admin" &&
            req.user.role !=="staff" &&
            customer.userId.toString() !== req.user.id
        ){
            return res.status(403).json({error:"Access Denied"});
        }

        const {error} = validateUpdateCustomer(req.body);
        if(error){
            return res.status(400).json({errors: error.details.map(d => d.message)});
        }

        await customers.updateOne(
            {_id: new ObjectId(id)},
            {$set: {...req.body, updatedAt: new Date()}}
        );

        res.json({message:"Customer updated successfully."})
    } catch (error) {
        console.error("Update Customer Error: ", error);
        res.status(500).json({error:"Internal server error!"})
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const db = getDB();
        const customers = db.collection("customers");
        const {id} = req.params;

        const customer = await customers.findOne({_id: new ObjectId(id)});
        if(!customer) {
            return res.status(404).json({error:"Customer not found"});
        }

        if(
            req.user.role !== "admin" &&
            req.user.role !== "staff" &&
            customer.userId.toString() !== req.user.id
        ){
            return res.status(403).json({ error: "Access denied" });
        }

        await customers.deleteOne({_id: new ObjectId(id)});
        res.json({message:"Customer deleted successfully"});
    } catch (error) {
        console.error("DElete customer error: ", error);
        res.status(500).json({error:"Internal server error"});
    }
};

module.exports={createCustomer, getCustomerById, getAllCustomers, updateCustomer, deleteCustomer};