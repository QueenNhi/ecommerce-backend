/**
 * staffRoutes.js
 * Mount tại: /api/admin/staff (trong server.js)
 *
 * Endpoints:
 *   GET    /api/admin/staff                      → Lấy danh sách nhân viên
 *   GET    /api/admin/staff/:id                  → Lấy chi tiết 1 nhân viên
 *   POST   /api/admin/staff                      → Tạo nhân viên mới
 *   PUT    /api/admin/staff/:id                  → Cập nhật thông tin nhân viên
 *   DELETE /api/admin/staff/:id                  → Xóa nhân viên (chặn Admin role)
 *   PATCH  /api/admin/staff/:id/status           → Kích hoạt / Vô hiệu hóa
 *   PATCH  /api/admin/staff/:id/reset-password   → Đặt lại mật khẩu
 */

const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    getStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    updateStaffStatus,
    resetStaffPassword
} = require("../controllers/staffController");

// Yêu cầu xác thực và quyền Admin cho tất cả các endpoint quản lý nhân viên
router.use(verifyToken, verifyAdmin);

// GET    /api/admin/staff
router.get("/", getStaff);

// GET    /api/admin/staff/:id
router.get("/:id", getStaffById);

// POST   /api/admin/staff
router.post("/", createStaff);

// PUT    /api/admin/staff/:id
router.put("/:id", updateStaff);

// DELETE /api/admin/staff/:id
router.delete("/:id", deleteStaff);

// PATCH  /api/admin/staff/:id/status
router.patch("/:id/status", updateStaffStatus);

// PATCH  /api/admin/staff/:id/reset-password
router.patch("/:id/reset-password", resetStaffPassword);

module.exports = router;

