const { getDB } = require("../database/db");
const { hallSchema, updateHallSchema } = require("../validators/hallValidator");

const createHall = async (req, res) => {
    try {
        const {error} = hallSchema.validate(req.body);
        if(error) return res.status(400).json({error: error.details[0].message});

        const db = getDB();
        const {hallId} = req.body;

        const existingHall = await db.collection("halls").findOne({hallId});
        if(existingHall) return res.status(400).json({error:"Hall Id already exists"});

        const newHall = await db.collection("halls").insertOne({
            ...req.body,
            availability: true,
        });

        res.status(201).json({message:"Hall created successfully!", newHall});
    } catch(error){
        res.status(500).json({error: error.message});
    }
};

const getAllHalls = async (req, res) => {
    try {
       const db = getDB();
       const halls = await db.collection("halls").find().toArray();
       res.status(200).json(halls);
    } catch (error) {
         res.status(500).json({ error: error.message });
    }
};

const getHallById = async (req, res) => {
  try {
    const db = getDB();
    const hall = await db.collection("halls").findOne({ hallId: req.params.hallId });

    if (!hall) return res.status(404).json({ error: "Hall not found" });
    res.status(200).json(hall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateHall = async (req, res) => {
    try {
        const {error} = updateHallSchema.validate(req.body);
        if(error) return res.status(400).json({error: error.details[0].message});

        const db = getDB();
        const result = await db.collection("halls").updateOne(
            {hallId: req.params.hallId},
            {$set: {...req.body, updatedAt: new Date() } }
        );

        if(result.matchedCount === 0)
            return res.status(404).json({error:"Hall not found"});

        res.status(200).json({message:"HAll updated successfully."});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const deleteHall = async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection("halls").deleteOne({hallId: req.params.hallId});

        if(result.deletedCount === 0)
            return res.status(404).json({error: "hall not found"});

        res.status(200).json({message:"Hall deleted successfully"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

module.exports = {
  createHall,
  getAllHalls,
  getHallById,
  updateHall,
  deleteHall,
};