const {getDB} = require("../database/db");
const {restaurantSchema, updateRestaurantSchema} = require("../validators/restaurantValidator");

const createRestaurant = async (req, res) => {
    try {
        const {error} = restaurantSchema.validate(req.body);
        if(error) return res.status(400).json({error: error.details[0].message});

        const db= getDB();
        const {_id} = req.body;

        const existing = await db.collection("restaurants").findOne({_id});
        if(existing) return res.status(400).json({error:"Restaurant ID already exists."});

        const newrestaurant = await db.collection("restaurants").insertOne(req.body);

        res.status(201).json({message:"Restaurants created successfully", newrestaurant});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const getAllRestaurants = async (req, res) => {
    try {
        const db = getDB();
        const restaurants = await db.collection("restaurants").find().toArray();
    res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRestaurantById = async (req, res) => {
  try {
    const db = getDB();
    const restaurant = await db.collection("restaurants").findOne({ _id: req.params.id });
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRestaurant = async (res, req) => {
    try {
        const {error} = updateRestaurantSchema.validate(req.body);
        if(error) return res.status(400).json({error: error.details[0].message});

        const db= getDB();
        const result = await db.collection("restaurants").updateOne(
            {_id: req.params.id},
            {$set:{...req.body, updatedAt: new Date()}}
        );

        if(result.matchedCount === 0) return res.status(404).json({error:"Restaurant not found."});

        res.status(200).json({message:"Restaurant updated successfully."});

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteRestaurant = async (req, res) => {
    try {
    const db = getDB();
    const result = await db.collection("restaurants").deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Restaurant not found" });

    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports={createRestaurant, getAllRestaurants, getRestaurantById, updateRestaurant, deleteRestaurant};