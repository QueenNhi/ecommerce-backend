const express = require("express");
const router = express.Router();

const {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
} = require("../controllers/promotionController");

// GET /api/admin/promotions
router.get("/", getPromotions);

// POST /api/admin/promotions
router.post("/", createPromotion);

// PUT /api/admin/promotions/:id
router.put("/:id", updatePromotion);

// DELETE /api/admin/promotions/:id
router.delete("/:id", deletePromotion);

module.exports = router;
