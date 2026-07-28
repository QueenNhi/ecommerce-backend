const express = require("express");
const router = express.Router();

const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    getUserOrders
} = require("../controllers/orderController");

// POST /api/orders - Create new order
router.post("/", createOrder);

// GET /api/orders/admin/all - Get all orders for Admin
router.get("/admin/all", getAllOrders);
router.get("/all", getAllOrders);

// GET /api/orders/user/:userId - Get orders for user
router.get("/user/:userId", getUserOrders);

// PUT /api/orders/:id/status - Update order status
router.put("/:id/status", updateOrderStatus);

// PUT /api/orders/:id/payment-status - Update payment status (Admin/Staff)
router.put("/:id/payment-status", updatePaymentStatus);

// GET /api/orders/:id - Get order by ID
router.get("/:id", getOrderById);

module.exports = router;
