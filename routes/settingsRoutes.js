const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/settingsController");

// GET /api/admin/settings
router.get("/", getSettings);

// PUT /api/admin/settings
router.put("/", updateSettings);

module.exports = router;
