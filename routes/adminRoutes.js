const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    getDashboardStats,
    getCustomers,
    updateCustomerStatus,
    deleteCustomer
} = require("../controllers/adminController");

// Tất cả các route trong adminRoutes đều yêu cầu verifyToken & verifyAdmin
router.use(verifyToken, verifyAdmin);

// GET /api/admin/stats - Get dashboard overview statistics
router.get("/stats", getDashboardStats);

// Customer Management
router.get("/customers", getCustomers);
router.put("/customers/:id/status", updateCustomerStatus);
router.delete("/customers/:id", deleteCustomer);

module.exports = router;

