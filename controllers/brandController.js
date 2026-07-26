const db = require("../config/db");

// ======================================
// GET ALL BRANDS
// GET /api/brands & GET /api/admin/brands
// ======================================
const getBrands = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                brands.id,
                brands.name,
                brands.logo,
                brands.created_at,
                COUNT(products.id) AS product_count
            FROM brands
            LEFT JOIN products ON brands.id = products.brand_id
            GROUP BY brands.id
            ORDER BY brands.id DESC
        `);

        res.json({
            success: true,
            brands: result.rows
        });
    } catch (err) {
        console.error("Get brands error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách thương hiệu."
        });
    }
};

// ======================================
// CREATE BRAND
// POST /api/brands & POST /api/admin/brands
// ======================================
const createBrand = async (req, res) => {
    try {
        const { name } = req.body;
        const logo = req.file ? req.file.filename : null;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Tên thương hiệu không được để trống."
            });
        }

        const result = await db.query(
            `
            INSERT INTO brands (name, logo, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *
            `,
            [name.trim(), logo]
        );

        res.status(201).json({
            success: true,
            message: "Thêm thương hiệu thành công!",
            brand: result.rows[0]
        });
    } catch (err) {
        console.error("Create brand error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi tạo thương hiệu mới."
        });
    }
};

// ======================================
// UPDATE BRAND
// PUT /api/brands/:id & PUT /api/admin/brands/:id
// ======================================
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const logo = req.file ? req.file.filename : null;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Tên thương hiệu không được để trống."
            });
        }

        let result;
        if (logo) {
            result = await db.query(
                `
                UPDATE brands
                SET name = $1, logo = $2
                WHERE id = $3
                RETURNING *
                `,
                [name.trim(), logo, id]
            );
        } else {
            result = await db.query(
                `
                UPDATE brands
                SET name = $1
                WHERE id = $2
                RETURNING *
                `,
                [name.trim(), id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thương hiệu."
            });
        }

        res.json({
            success: true,
            message: "Cập nhật thương hiệu thành công!",
            brand: result.rows[0]
        });
    } catch (err) {
        console.error("Update brand error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật thương hiệu."
        });
    }
};

// ======================================
// DELETE BRAND
// DELETE /api/brands/:id & DELETE /api/admin/brands/:id
// ======================================
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if products reference this brand
        const checkResult = await db.query(
            "SELECT COUNT(*) FROM products WHERE brand_id = $1",
            [id]
        );

        const productCount = parseInt(checkResult.rows[0].count, 10);
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa thương hiệu này vì đang có ${productCount} sản phẩm thuộc thương hiệu.`
            });
        }

        const deleteResult = await db.query(
            "DELETE FROM brands WHERE id = $1 RETURNING id",
            [id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thương hiệu để xóa."
            });
        }

        res.json({
            success: true,
            message: "Xóa thương hiệu thành công!"
        });
    } catch (err) {
        console.error("Delete brand error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi xóa thương hiệu."
        });
    }
};

module.exports = {
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand
};