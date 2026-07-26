const db = require("../config/db");

// ======================================
// GET ALL COLLECTIONS
// GET /api/admin/collections
// ======================================
const getCollections = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM collections ORDER BY id DESC");
        res.json({
            success: true,
            collections: result.rows
        });
    } catch (err) {
        console.error("Get collections error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách bộ sưu tập."
        });
    }
};

// ======================================
// CREATE COLLECTION
// POST /api/admin/collections
// ======================================
const createCollection = async (req, res) => {
    try {
        const { name, description, banner_url = "", status = "active" } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Tên bộ sưu tập không được để trống."
            });
        }

        const result = await db.query(
            `
            INSERT INTO collections (name, description, banner_url, status, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
            `,
            [name.trim(), description || "", banner_url, status.toLowerCase()]
        );

        res.status(201).json({
            success: true,
            message: "Tạo bộ sưu tập mới thành công!",
            collection: result.rows[0]
        });
    } catch (err) {
        console.error("Create collection error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi tạo bộ sưu tập mới."
        });
    }
};

module.exports = {
    getCollections,
    createCollection
};
