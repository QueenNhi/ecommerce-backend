const express = require("express");
const router = express.Router();

const { getCollections, createCollection } = require("../controllers/collectionController");

// GET /api/admin/collections
router.get("/", getCollections);

// POST /api/admin/collections
router.post("/", createCollection);

module.exports = router;
