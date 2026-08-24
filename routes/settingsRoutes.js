const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const { getSettings, updateSettings } = require("../controllers/settingsController");

// Bảo vệ tất cả các endpoint cài đặt hệ thống
router.use(verifyToken, verifyAdmin);

// GET /api/admin/settings
router.get("/", getSettings);

// PUT /api/admin/settings
router.put("/", updateSettings);

module.exports = router;

