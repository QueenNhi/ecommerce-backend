const db = require("../config/db");

// ======================================
// GET SITE SETTINGS
// GET /api/admin/settings
// ======================================
const getSettings = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM settings WHERE id = 1");
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                settings: {
                    store_name: "Heritage Luxury Store",
                    contact_email: "contact@luxurybag.com",
                    contact_phone: "0869081120",
                    address: "123 Le Loi, District 1, Ho Chi Minh City",
                    maintenance_mode: false
                }
            });
        }
        res.json({
            success: true,
            settings: result.rows[0]
        });
    } catch (err) {
        console.error("Get settings error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy cấu hình hệ thống."
        });
    }
};

// ======================================
// UPDATE SITE SETTINGS
// PUT /api/admin/settings
// ======================================
const updateSettings = async (req, res) => {
    try {
        const {
            store_name = "Heritage Luxury Store",
            contact_email = "contact@luxurybag.com",
            contact_phone = "0869081120",
            address = "123 Le Loi, District 1, Ho Chi Minh City",
            maintenance_mode = false
        } = req.body;

        const result = await db.query(
            `
            INSERT INTO settings (id, store_name, contact_email, contact_phone, address, maintenance_mode, updated_at)
            VALUES (1, $1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE
            SET store_name = EXCLUDED.store_name,
                contact_email = EXCLUDED.contact_email,
                contact_phone = EXCLUDED.contact_phone,
                address = EXCLUDED.address,
                maintenance_mode = EXCLUDED.maintenance_mode,
                updated_at = NOW()
            RETURNING *
            `,
            [store_name, contact_email, contact_phone, address, Boolean(maintenance_mode)]
        );

        res.json({
            success: true,
            message: "Lưu cấu hình hệ thống thành công!",
            settings: result.rows[0]
        });
    } catch (err) {
        console.error("Update settings error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật cấu hình hệ thống."
        });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
