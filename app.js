const express = require('express')
const cors = require('cors');
const dotenv = require('dotenv')
const {connectDB} = require("./database/db")

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json())

connectDB();

// const indexRouter = require('./routes/index')
// app.use('/', indexRouter);

app.get('/health', (req, res) => {
    res.status(200).json({status: 'Okay', message: 'Server is running fine!'})
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Started On Port ${PORT}`)
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: 'Something went wrong!'});
});