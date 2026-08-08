const db = require("../config/db");

// ======================================
// GET ALL PROMOTIONS
// GET /api/admin/promotions
// ======================================
const getPromotions = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT * FROM promotions ORDER BY id DESC
        `);
        res.json({
            success: true,
            promotions: result.rows
        });
    } catch (err) {
        console.error("Get promotions error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách mã khuyến mãi."
        });
    }
};

// ======================================
// CREATE PROMOTION
// POST /api/admin/promotions
// ======================================
const createPromotion = async (req, res) => {
    try {
        const {
            code,
            discount_percent = 0,
            discount_amount = 0,
            min_order_amount = 0,
            expiration_date,
            status = "active"
        } = req.body;

        if (!code || code.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Mã khuyến mãi không được để trống."
            });
        }

        const result = await db.query(
            `
            INSERT INTO promotions (code, discount_percent, discount_amount, min_order_amount, expiration_date, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *
            `,
            [
                code.trim().toUpperCase(),
                Number(discount_percent) || 0,
                Number(discount_amount) || 0,
                Number(min_order_amount) || 0,
                expiration_date || null,
                status.toLowerCase()
            ]
        );

        res.status(201).json({
            success: true,
            message: "Tạo mã khuyến mãi thành công!",
            promotion: result.rows[0]
        });
    } catch (err) {
        console.error("Create promotion error:", err);
        if (err.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "Mã khuyến mãi này đã tồn tại."
            });
        }
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi tạo mã khuyến mãi."
        });
    }
};

// ======================================
// UPDATE PROMOTION
// PUT /api/admin/promotions/:id
// ======================================
const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code,
            discount_percent = 0,
            discount_amount = 0,
            min_order_amount = 0,
            expiration_date,
            status = "active"
        } = req.body;

        if (!code || code.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Mã khuyến mãi không được để trống."
            });
        }

        const result = await db.query(
            `
            UPDATE promotions
            SET code = $1, discount_percent = $2, discount_amount = $3, min_order_amount = $4, expiration_date = $5, status = $6
            WHERE id = $7
            RETURNING *
            `,
            [
                code.trim().toUpperCase(),
                Number(discount_percent) || 0,
                Number(discount_amount) || 0,
                Number(min_order_amount) || 0,
                expiration_date || null,
                status.toLowerCase(),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy mã khuyến mãi."
            });
        }

        res.json({
            success: true,
            message: "Cập nhật mã khuyến mãi thành công!",
            promotion: result.rows[0]
        });
    } catch (err) {
        console.error("Update promotion error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật mã khuyến mãi."
        });
    }
};

// ======================================
// DELETE PROMOTION
// DELETE /api/admin/promotions/:id
// ======================================
const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query("DELETE FROM promotions WHERE id = $1 RETURNING id", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy mã khuyến mãi để xóa."
            });
        }

        res.json({
            success: true,
            message: "Xóa mã khuyến mãi thành công!"
        });
    } catch (err) {
        console.error("Delete promotion error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi xóa mã khuyến mãi."
        });
    }
};

// ======================================
// VALIDATE COUPON
// POST /api/promotions/validate
// ======================================
const validateCoupon = async (req, res) => {
    try {
        const { code, totalAmount = 0 } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mã giảm giá."
            });
        }

        const upperCode = code.trim().toUpperCase();

        const result = await db.query(
            `SELECT * FROM promotions WHERE UPPER(code) = $1 AND LOWER(status) = 'active'`,
            [upperCode]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Mã giảm giá không hợp lệ hoặc đã hết hạn."
            });
        }

        const promo = result.rows[0];

        if (promo.expiration_date && new Date(promo.expiration_date) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Mã giảm giá này đã hết hạn sử dụng."
            });
        }

        if (promo.min_order_amount && Number(totalAmount) < Number(promo.min_order_amount)) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${Number(promo.min_order_amount).toLocaleString("vi-VN")}₫ mới có thể áp dụng mã này.`
            });
        }

        let calculatedDiscount = 0;
        if (Number(promo.discount_amount) > 0) {
            calculatedDiscount = Number(promo.discount_amount);
        } else if (Number(promo.discount_percent) > 0) {
            calculatedDiscount = (Number(totalAmount) * Number(promo.discount_percent)) / 100;
        }

        return res.json({
            success: true,
            message: "Áp dụng mã giảm giá thành công!",
            coupon: {
                code: promo.code,
                discount_percent: promo.discount_percent,
                discount_amount: promo.discount_amount,
                discount: calculatedDiscount,
                calculatedDiscount
            }
        });
    } catch (err) {
        console.error("Validate coupon error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Lỗi kiểm tra mã giảm giá."
        });
    }
};

module.exports = {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    validateCoupon
};
