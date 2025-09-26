const {connectDB, getDB} = require("../database/db");
const bcrypt = require("bcrypt");

const migratePasswords = async () => {
    try {
        console.log("Connecting to mongodb...");
        await connectDB();
        const db = getDB();
        console.log("connected to database");


        console.log("fetching users");
        const users = await db.collection("users").find({}).toArray();

        for(let user of users) {
            if(user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
                console.log(`Skipping: ${user.email} (already hashed)`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);

            await db.collection("users").updateOne(
                {_id: user._id},
                {$set: {password: hashedPassword}}
            );

            console.log(`Updated password for: ${user.email}`);
        }

        console.log("Migration Completed!");
        process.exit();

    } catch (error) {
        console.error("Migration failed: ", error);
        process.exit(1);
    }
}

migratePasswords();