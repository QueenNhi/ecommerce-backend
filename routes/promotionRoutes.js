const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    validateCoupon
} = require("../controllers/promotionController");

// POST /api/promotions/validate (Công khai cho khách hàng)
router.post("/validate", validateCoupon);

// GET /api/promotions/public (Công khai lấy danh sách khuyến mãi)
router.get("/public", getPromotions);

// Tất cả các route quản trị khuyến mãi bên dưới bắt buộc phải có verifyToken & verifyAdmin
router.get("/", verifyToken, verifyAdmin, getPromotions);
router.post("/", verifyToken, verifyAdmin, createPromotion);
router.put("/:id", verifyToken, verifyAdmin, updatePromotion);
router.delete("/:id", verifyToken, verifyAdmin, deletePromotion);

module.exports = router;

