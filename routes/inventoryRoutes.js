const express = require("express");
const router = express.Router();

const { verifyToken, verifyAdmin, verifyAdminOrWarehouse } = require("../middleware/authMiddleware");
const { getInventory, updateStock } = require("../controllers/inventoryController");

// GET /api/admin/inventory — Admin & Warehouse Staff
router.get("/", verifyToken, verifyAdminOrWarehouse, getInventory);

// PUT /api/admin/inventory/:id — Admin & Warehouse Staff
router.put("/:id", verifyToken, verifyAdminOrWarehouse, updateStock);

module.exports = router;
