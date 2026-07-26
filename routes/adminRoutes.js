const express = require("express");
const router = express.Router();

const {
    getDashboardStats,
    getCustomers,
    updateCustomerStatus,
    deleteCustomer
} = require("../controllers/adminController");

// GET /api/admin/stats - Get dashboard overview statistics
router.get("/stats", getDashboardStats);

// Customer Management
router.get("/customers", getCustomers);
router.put("/customers/:id/status", updateCustomerStatus);
router.delete("/customers/:id", deleteCustomer);

module.exports = router;
