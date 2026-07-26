const express = require("express");
const router = express.Router();

const {
    getReviews,
    deleteReview
} = require("../controllers/reviewController");

// GET /api/admin/reviews
router.get("/", getReviews);

// DELETE /api/admin/reviews/:id
router.delete("/:id", deleteReview);

module.exports = router;
