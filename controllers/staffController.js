/**
 * staffController.js
 * Quản lý nhân viên (admin, sale, warehouse)
 * Bảng: users (dùng chung với customers, phân biệt qua role)
 *
 * Roles hợp lệ cho Staff: admin | sale | warehouse
 */

const db = require("../config/db");
const bcrypt = require("bcrypt");

// Danh sách role được coi là staff (không phải customer)
const STAFF_ROLES = ["admin", "sale", "warehouse"];

// ============================================================
// GET ALL STAFF
// GET /api/admin/staff
// Trả về tất cả user có role là admin/sale/warehouse
// ============================================================
const getStaff = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                id,
                fullname,
                email,
                phone,
                role,
                status,
                avatar,
                created_at
            FROM users
            WHERE role = ANY($1::text[])
            ORDER BY id DESC`,
            [STAFF_ROLES]
        );

        res.json({
            success: true,
            staff: result.rows
        });
    } catch (err) {
        console.error("Get staff error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách nhân viên."
        });
    }
};

// ============================================================
// GET SINGLE STAFF
// GET /api/admin/staff/:id
// ============================================================
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT id, fullname, email, phone, role, status, avatar, created_at
             FROM users
             WHERE id = $1 AND role = ANY($2::text[])`,
            [id, STAFF_ROLES]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhân viên."
            });
        }

        res.json({
            success: true,
            staff: result.rows[0]
        });
    } catch (err) {
        console.error("Get staff by id error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy thông tin nhân viên."
        });
    }
};

// ============================================================
// CREATE STAFF
// POST /api/admin/staff
// Body: { fullname, email, phone, password, role, status }
// Password được hash bằng bcrypt (10 rounds)
// ============================================================
const createStaff = async (req, res) => {
    try {
        const {
            fullname,
            email,
            phone = "",
            password,
            role = "sale",
            status = "active"
        } = req.body;

        // Validate bắt buộc
        if (!fullname || !fullname.trim()) {
            return res.status(400).json({
                success: false,
                message: "Họ tên nhân viên là bắt buộc."
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email là bắt buộc."
            });
        }

        // Validate định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Định dạng email không hợp lệ."
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu phải có ít nhất 6 ký tự."
            });
        }

        // Validate role
        if (!STAFF_ROLES.includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${STAFF_ROLES.join(", ")}.`
            });
        }

        // Validate status
        if (!["active", "inactive"].includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive."
            });
        }

        // Kiểm tra email trùng
        const existingUser = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email này đã được sử dụng bởi một tài khoản khác."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo nhân viên mới
        const result = await db.query(
            `INSERT INTO users (fullname, email, phone, password, role, status, avatar, address)
             VALUES ($1, $2, $3, $4, $5, $6, '', '')
             RETURNING id, fullname, email, phone, role, status, created_at`,
            [
                fullname.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                hashedPassword,
                role.toLowerCase(),
                status.toLowerCase()
            ]
        );

        res.status(201).json({
            success: true,
            message: "Tạo tài khoản nhân viên thành công!",
            staff: result.rows[0]
        });
    } catch (err) {
        console.error("Create staff error:", err);

        // Lỗi unique constraint từ PostgreSQL
        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Email này đã được sử dụng."
            });
        }

        res.status(500).json({
            success: false,
            message: err.message || "Lỗi tạo nhân viên."
        });
    }
};

// ============================================================
// UPDATE STAFF
// PUT /api/admin/staff/:id
// Body: { fullname, phone, role, status }
// Email KHÔNG được phép thay đổi
// ============================================================
const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullname,
            phone,
            role,
            status
        } = req.body;

        // Validate bắt buộc
        if (!fullname || !fullname.trim()) {
            return res.status(400).json({
                success: false,
                message: "Họ tên nhân viên là bắt buộc."
            });
        }

        // Validate role nếu có
        if (role && !STAFF_ROLES.includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${STAFF_ROLES.join(", ")}.`
            });
        }

        // Validate status nếu có
        if (status && !["active", "inactive"].includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive."
            });
        }

        // Kiểm tra nhân viên tồn tại
        const existing = await db.query(
            "SELECT id, role FROM users WHERE id = $1 AND role = ANY($2::text[])",
            [id, STAFF_ROLES]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhân viên."
            });
        }

        // Cập nhật thông tin (không cho đổi email)
        const result = await db.query(
            `UPDATE users
             SET
                fullname = $1,
                phone    = $2,
                role     = COALESCE($3, role),
                status   = COALESCE($4, status)
             WHERE id = $5
             RETURNING id, fullname, email, phone, role, status, created_at`,
            [
                fullname.trim(),
                (phone || "").trim(),
                role ? role.toLowerCase() : null,
                status ? status.toLowerCase() : null,
                id
            ]
        );

        res.json({
            success: true,
            message: "Cập nhật thông tin nhân viên thành công!",
            staff: result.rows[0]
        });
    } catch (err) {
        console.error("Update staff error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật nhân viên."
        });
    }
};

// ============================================================
// DELETE STAFF
// DELETE /api/admin/staff/:id
// Không cho phép xóa Admin (role = 'admin')
// ============================================================
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra nhân viên tồn tại
        const existing = await db.query(
            "SELECT id, role FROM users WHERE id = $1 AND role = ANY($2::text[])",
            [id, STAFF_ROLES]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhân viên."
            });
        }

        // Chặn xóa tài khoản Admin
        if (existing.rows[0].role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Không thể xóa tài khoản Admin. Vui lòng đổi vai trò sang Sale hoặc Warehouse trước."
            });
        }

        await db.query("DELETE FROM users WHERE id = $1", [id]);

        res.json({
            success: true,
            message: "Xóa tài khoản nhân viên thành công!"
        });
    } catch (err) {
        console.error("Delete staff error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi xóa nhân viên."
        });
    }
};

// ============================================================
// UPDATE STAFF STATUS (Activate / Deactivate)
// PATCH /api/admin/staff/:id/status
// Body: { status: "active" | "inactive" }
// ============================================================
const updateStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["active", "inactive"].includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive."
            });
        }

        // Kiểm tra nhân viên tồn tại
        const existing = await db.query(
            "SELECT id FROM users WHERE id = $1 AND role = ANY($2::text[])",
            [id, STAFF_ROLES]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhân viên."
            });
        }

        const result = await db.query(
            `UPDATE users
             SET status = $1
             WHERE id = $2
             RETURNING id, fullname, email, role, status`,
            [status.toLowerCase(), id]
        );

        const statusLabel = status === "active" ? "kích hoạt" : "vô hiệu hóa";

        res.json({
            success: true,
            message: `Đã ${statusLabel} tài khoản nhân viên thành công!`,
            staff: result.rows[0]
        });
    } catch (err) {
        console.error("Update staff status error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật trạng thái nhân viên."
        });
    }
};

// ============================================================
// RESET STAFF PASSWORD
// PATCH /api/admin/staff/:id/reset-password
// Body: { password } — plain text, backend tự bcrypt hash
// ============================================================
const resetStaffPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu mới phải có ít nhất 6 ký tự."
            });
        }

        // Kiểm tra nhân viên tồn tại
        const existing = await db.query(
            "SELECT id FROM users WHERE id = $1 AND role = ANY($2::text[])",
            [id, STAFF_ROLES]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhân viên."
            });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedPassword, id]
        );

        res.json({
            success: true,
            message: "Đặt lại mật khẩu nhân viên thành công!"
        });
    } catch (err) {
        console.error("Reset staff password error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi đặt lại mật khẩu nhân viên."
        });
    }
};

module.exports = {
    getStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    updateStaffStatus,
    resetStaffPassword
};
