const db = require("../config/db");

// ==================================================
// GET INVENTORY LIST (ADMIN)
// GET /api/admin/inventory
// ==================================================
const getInventory = async (req, res) => {
    try {
        const LOW_STOCK_THRESHOLD = 10;

        const result = await db.query(`
            SELECT
                p.id,
                p.name,
                p.image_url,
                p.price,
                p.stock_quantity,
                p.status,
                c.name AS category_name,
                b.name AS brand_name,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands     b ON p.brand_id    = b.id
            ORDER BY p.stock_quantity ASC, p.id ASC
        `);

        const products = result.rows.map(product => ({
            ...product,
            stock_quantity: Number(product.stock_quantity) || 0,
            is_out_of_stock: Number(product.stock_quantity) <= 0,
            is_low_stock: Number(product.stock_quantity) > 0 && Number(product.stock_quantity) <= LOW_STOCK_THRESHOLD,
            low_stock_threshold: LOW_STOCK_THRESHOLD
        }));

        // Summary stats
        const stats = {
            total_products: products.length,
            out_of_stock_count: products.filter(p => p.is_out_of_stock).length,
            low_stock_count: products.filter(p => p.is_low_stock).length,
            in_stock_count: products.filter(p => !p.is_out_of_stock && !p.is_low_stock).length
        };

        res.json({
            success: true,
            stats,
            products
        });

    } catch (err) {
        console.error("getInventory error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy dữ liệu kho hàng."
        });
    }
};

// ==================================================
// UPDATE STOCK QUANTITY (ADMIN / WAREHOUSE STAFF)
// PUT /api/admin/inventory/:id
// Body: { stock_quantity: number }
// ==================================================
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_quantity } = req.body;

        if (stock_quantity === undefined || stock_quantity === null || isNaN(Number(stock_quantity))) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp số lượng tồn kho hợp lệ."
            });
        }

        const qty = Number(stock_quantity);

        if (qty < 0) {
            return res.status(400).json({
                success: false,
                message: "Số lượng tồn kho không thể âm."
            });
        }

        const sql = `
            UPDATE products
            SET stock_quantity = $1
            WHERE id = $2
            RETURNING id, name, stock_quantity, status
        `;
        const params = [qty, id];

        const result = await db.query(sql, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm."
            });
        }

        const updated = result.rows[0];

        res.json({
            success: true,
            message: `Cập nhật tồn kho thành công! Số lượng hiện tại: ${updated.stock_quantity}`,
            product: {
                ...updated,
                stock_quantity: Number(updated.stock_quantity)
            }
        });

    } catch (err) {
        console.error("updateStock error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật tồn kho."
        });
    }
};

module.exports = {
    getInventory,
    updateStock
};
