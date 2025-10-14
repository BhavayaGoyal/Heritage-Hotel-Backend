const {getDB} = require("../database/db");
const {ObjectId} = require('mongodb');

const getActivePromotions = async (req, res) => {
    try {
        const db = getDB();
        const promotions = await db.collection("promotions")
        .find({status: "active"})
        .sort({createdAt: -1})
        .toArray();
        res.json(promotions);

    } catch (error) {
        console.error("Error fetching active promotions: ", error);
        res.status(500).json({error:"Failed to fetch active promotions"});
    }
};

const getAllPromotions = async (req, res) => {
    try {
        const db = getDB();
        const promotions = await db.collection("promotions")
        .find({})
        .sort({createdAt: -1})
        .toArray();
        res.json(promotions);

    } catch (error) {
        console.error("Error fetching all promotions: ", error);
        res.status(500).json({error:"Failed to fetch all promotions"});
    }
};

const addPromotions = async (req, res) => {
    try {
        const db = getDB();
        const newPromo = req.body;

        const lastPromo = await db.collection("promotions")
        .find({promotionId: {$regex: /^promo_\d+$/}})
        .sort({promotionId: -1})
        .limit(1)
        .toArray();

        const newIdNum = lastPromo.length>0
        ?parseInt(lastPromo[0].promotionId.split("_")[1])+1
        : 1;

        newPromo.promotionId = `promo -${newIdNum.toString().padStart(3,"0")}`;
        newPromo.createdAt = new Date();

        await db.collection("promotions").insertOne(newPromo);
        res.status(201).json({message:"Promotion added successfully ", promotion: newPromo});

    } catch (error) {
        console.error("Error adding promotion: ", error);
        res.status(500).json({error:"Failed to add promotion"});
    }
}

const updatePromotion = async (req, res) => {
    try {
        const db = getDB();
    const { promotionId } = req.params;
    const updateData = req.body;

    const result = await db.collection("promotions").updateOne(
      { promotionId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    res.json({ message: "Promotion updated successfully" });
    } catch (error) {
        console.error("Error updating promotion:", error);
        res.status(500).json({ error: "Failed to update promotion" });
    }
}

const deletePromotion = async (req, res) => {
  try {
    const db = getDB();
    const { promotionId } = req.params;

    const result = await db.collection("promotions").deleteOne({ promotionId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    res.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    res.status(500).json({ error: "Failed to delete promotion" });
  }
};

module.exports = {getActivePromotions, getAllPromotions, addPromotions, updatePromotion, deletePromotion};