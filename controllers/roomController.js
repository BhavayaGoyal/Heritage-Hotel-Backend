const {getDB} = require("../database/db");

const getAllRooms = async (req, res) => {
    try {
        const db = getDB();
        const rooms = await db.collection("rooms").find().toArray();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({message:"Error fetching rooms.", error: error.message});
    }
};

const getRoomByid = async (req, res) => {
    try {
        const db = getDB();

        const room = await db.collection("rooms").findOne({roomid: req.params.roomid});

        if(!room) {
            return res.status(404).json({message:"Room not found!"});
        }
        res.json(room);

    } catch (error) {
        res.status(500).json({message:"Error fetching rooms.", error: error.message});
    }
};

const updateRoomAvailability = async (req, res) => {
    try {
        const db = getDB();
        const {roomId, count} = req.body;

        const room = await db.collection("rooms").findOne({roomId});
        if(!room) return res.status(404).json({message: "Room not found"});

        const newCount = room.totalRooms + count;
        if(newCount < 0){
            return res.status(400).json({message:"Not eough rooms available"});
        }

        await db.collection("rooms").updateOne(
            {roomId},
            {$set : {totalRooms: newCount, availability: newCount > 0 ? "true" : "false"}}
        );

        res.json({message:"Room availability updated successfully"});

    } catch (error) {
        res.status(500).json({message:"Error updating availability", error: error.message});
    }
};

module.exports = {getAllRooms, getRoomByid, updateRoomAvailability};