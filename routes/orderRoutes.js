const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    getUserOrders
} = require("../controllers/orderController");

// POST /api/orders - Tạo đơn hàng (Cho phép khách hàng / người dùng đã đăng nhập)
router.post("/", createOrder);

// GET /api/orders/admin/all & /all - Lấy toàn bộ đơn hàng (Admin)
router.get("/admin/all", verifyToken, verifyAdmin, getAllOrders);
router.get("/all", verifyToken, verifyAdmin, getAllOrders);

// GET /api/orders/user/:userId - Lấy đơn hàng theo user (Cần đăng nhập)
router.get("/user/:userId", verifyToken, getUserOrders);

// PUT /api/orders/:id/status - Cập nhật trạng thái đơn hàng (Admin)
router.put("/:id/status", verifyToken, verifyAdmin, updateOrderStatus);

// PUT /api/orders/:id/payment-status - Cập nhật trạng thái thanh toán (Admin/Staff)
router.put("/:id/payment-status", verifyToken, verifyAdmin, updatePaymentStatus);

// GET /api/orders/:id - Lấy chi tiết đơn hàng theo ID
router.get("/:id", getOrderById);

module.exports = router;

