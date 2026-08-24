const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const { getCollections, createCollection } = require("../controllers/collectionController");

// Bảo vệ tất cả các endpoint quản lý bộ sưu tập
router.use(verifyToken, verifyAdmin);

// GET /api/admin/collections
router.get("/", getCollections);

// POST /api/admin/collections
router.post("/", createCollection);

module.exports = router;

