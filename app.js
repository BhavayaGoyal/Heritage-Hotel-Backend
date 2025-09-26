const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('./database/db');
const authRoutes = require('./routes/auth');
const roomRoutes = require("./routes/room");
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Okay', message: 'Server is running fine!' });
});

connectDB().then(() => {
  console.log('✅ MongoDB connected successfully');

  app.use('/api/auth', authRoutes);

  app.use("/api/rooms", roomRoutes);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });

}).catch(err => { 
  console.error('❌ Failed to connect to MongoDB:', err);
});
