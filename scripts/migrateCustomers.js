const {MongoClient} = require("mongodb");
const bcrypt = require("bcrypt");
const fs = require("fs");
require("dotenv").config();

function generatePassword(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@!#$";

    let password = "";

    for(let i=0; i<length; i++){
        password+= chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function migrateCustomers() {
    const client = new MongoClient(process.env.MONGO_URL);

    try {
        await client.connect();
        const db = client.db();

        const customers = await db.collection("customers").find().toArray();
        const exportData = [];

        for(const customer of customers) {
            const existingUser = await db.collection("users").findOne({email: customer.email});
            if(existingUser) continue;

            const plainPassword = generatePassword(10);
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            await db.collection("users").insertOne({
                name: customer.name,
                email: customer.email,
                password: hashedPassword,
                role:"customer",
                createdAt: new Date()
            });

            exportData.push({
                name: customer.name,
                email: customer.email,
                password: plainPassword
            });
        }

        fs.writeFileSync("customer_passwords.json", JSON.stringify(exportData, null, 2));
        console.log("Customers imported successfully!")

    } catch (error) {
        console.error("❌ Error:", err);
    } finally{
        await client.close();
    }
}

migrateCustomers();