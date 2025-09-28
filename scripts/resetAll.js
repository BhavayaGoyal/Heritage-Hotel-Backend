const fs = require("fs");
const bcrypt = require("bcrypt");
const {getDB, connectDB} = require("../database/db"); // reuse your db connection file

async function resetPasswords() {
  try {
    await connectDB();
     const db = getDB();
    const usersCollection = db.collection("users");

    // Fetch all users
    const users = await usersCollection.find().toArray();

    const updatedUsers = [];

    for (const user of users) {
      // Generate a new random password
      const newPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update in DB
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      // Save plain + hashed for reference
      updatedUsers.push({
        username: user.username,
        email: user.email,
        newPassword,
        hashedPassword
      });
    }

    // Save all new passwords to file
    fs.writeFileSync("updatedPasswords.json", JSON.stringify(updatedUsers, null, 2));
    console.log("✅ Passwords reset successfully. File saved as updatedPasswords.json");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error resetting passwords:", err);
    process.exit(1);
  }
}

resetPasswords();
