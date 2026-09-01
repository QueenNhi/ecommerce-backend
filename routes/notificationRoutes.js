const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const { getAdminNotifications, markAsRead } = require("../controllers/notificationController");

// Lấy danh sách thông báo (Admin)
router.get("/", verifyToken, verifyAdmin, getAdminNotifications);

// Đánh dấu đã đọc
router.put("/:id/read", verifyToken, verifyAdmin, markAsRead);

module.exports = router;
