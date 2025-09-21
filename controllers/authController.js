const {signupValidator, loginValidator} = require ('../validators/authValidator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {getDB} = require('../database/db');
const ObjectId = require('mongodb').ObjectId;

// SignUp API
const signup = async (req, res) => {
    try{
        const {error} = signupValidator.validate(req.body);
    if(error) return res.status(400).json({success: false, message:error.details[0].message});

    const db = getDB();
    const {name, email, password, role, phone } = req.body;

    const existingUser = await db.collection('users').findOne({email });
    if(existingUser) return res.status(400).json({success: false, message:"Email already registerd"});

    // Hash password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('users').insertOne({
        name, email, password: hashedPassword, role, phone, createdAt: new Date()
    });

    res.status(201).json({success: true, message:'User registerd successfully', userId: result.insertedId});
  } catch(err){
    console.error(err);
    res.status(500).json({success: false, message:"server error"});
  }
};

const login = async (req, res) => {
    try {
        const {error} = loginValidator.validate(req.body);
        if(error) return res.status(400).json({success: false, message:error.details[0].message});

        const db = getDB();
        const {email, password} = req.body;

        const user = await db.collection('users').findOne({email });
        if(!user) return res.status(400).json({success: false, message:'Invalid email'});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({success: false, message:'Invalid Password'});

       const token = jwt.sign({userId: user._id, role:user.role},process.env.JWT_SECRET, {expiresIn:'1d'});

        res.status(200).json({success: true, token, role: user.role});

    } catch (error) {
        console.error(error);
    res.status(500).json({success: false, message:"server error"});
    }
}

module.exports = {signup, login};