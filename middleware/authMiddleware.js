const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];

        if(!authHeader){
            return res.status(401).json({success: false, message:"No token provided."});
        }

        const token = authHeader.split(" ")[1];
        if(!token){
            return res.status(401).json({success: false, message:"Invalid token format."});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        console.error(error);
        res.status(401).json({success: false, message:"Unauthorized- Invalid token"});
    }
};

const verifyRole = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return res.ststus(403).json({success: false, message:"Access Denied!"})
        }
        next();
    };
};

module.exports = {verifyToken, verifyRole};