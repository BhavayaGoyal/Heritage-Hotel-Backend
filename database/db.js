const {MongoClient} = require ("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try{
        await client.connect();
        db=client.db("Hotel_Heritage");
        console.log("✅ MongoDb connected successfully");
    } catch(error){
        console.log("❌ MongoDB connection failed:", error.message);
    }
}

function getDB(){
    if(!db){
        throw new Error("Database not intialized. Call connectDB() 1st.")
    }
    return db;
}

module.exports = {connectDB, getDB};