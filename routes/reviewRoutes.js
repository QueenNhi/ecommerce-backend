const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    getReviews,
    deleteReview
} = require("../controllers/reviewController");

// Bảo vệ tất cả các endpoint quản lý đánh giá
router.use(verifyToken, verifyAdmin);

// GET /api/admin/reviews
router.get("/", getReviews);

// DELETE /api/admin/reviews/:id
router.delete("/:id", deleteReview);

module.exports = router;

