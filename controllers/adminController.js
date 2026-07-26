const db = require("../config/db");

// ======================================
// GET DASHBOARD STATS
// GET /api/admin/stats
// ======================================
const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Revenue (sum of non-cancelled orders)
        const revenueRes = await db.query(
            "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE order_status != 'cancelled'"
        );
        const totalRevenue = parseFloat(revenueRes.rows[0].total);

        // 2. Total Orders
        const ordersRes = await db.query("SELECT COUNT(*) AS total FROM orders");
        const totalOrders = parseInt(ordersRes.rows[0].total, 10);

        // 3. Total Products
        const productsRes = await db.query("SELECT COUNT(*) AS total FROM products");
        const totalProducts = parseInt(productsRes.rows[0].total, 10);

        // 4. Total Customers
        const customersRes = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
        const totalCustomers = parseInt(customersRes.rows[0].total, 10);

        // 5. Recent Orders (top 5)
        const recentOrdersRes = await db.query(`
            SELECT id, fullname, phone, address, total_price, payment_method, order_status, created_at
            FROM orders
            ORDER BY id DESC
            LIMIT 5
        `);

        // 6. Top Selling Products (top 4)
        const topProductsRes = await db.query(`
            SELECT 
                products.id,
                products.name,
                products.price,
                products.image_url,
                COALESCE(SUM(order_items.quantity), 0) AS total_sold
            FROM products
            LEFT JOIN order_items ON products.id = order_items.product_id
            GROUP BY products.id
            ORDER BY total_sold DESC, products.id ASC
            LIMIT 4
        `);

        // 7. Order Status Breakdown
        const statusRes = await db.query(`
            SELECT order_status, COUNT(*) AS count
            FROM orders
            GROUP BY order_status
        `);

        res.json({
            success: true,
            stats: {
                totalRevenue,
                totalOrders,
                totalProducts,
                totalCustomers,
                recentOrders: recentOrdersRes.rows,
                topProducts: topProductsRes.rows,
                statusBreakdown: statusRes.rows
            }
        });

    } catch (err) {
        console.error("Get admin stats error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy dữ liệu thống kê."
        });
    }
};

// ======================================
// GET ALL CUSTOMERS
// GET /api/admin/customers
// ======================================
const getCustomers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                users.id,
                users.fullname,
                users.email,
                users.phone,
                users.role,
                users.status,
                users.avatar,
                users.created_at,
                COUNT(orders.id) AS total_orders,
                COALESCE(SUM(CASE WHEN orders.order_status != 'cancelled' THEN orders.total_price ELSE 0 END), 0) AS total_spent
            FROM users
            LEFT JOIN orders ON users.id = orders.user_id
            WHERE users.role = 'customer' OR users.role IS NULL
            GROUP BY users.id
            ORDER BY users.id DESC
        `);

        res.json({
            success: true,
            customers: result.rows
        });
    } catch (err) {
        console.error("Get customers error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách khách hàng."
        });
    }
};

// ======================================
// UPDATE CUSTOMER STATUS
// PUT /api/admin/customers/:id/status
// ======================================
const updateCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["active", "blocked"].includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ. Sử dụng 'active' hoặc 'blocked'."
            });
        }

        const result = await db.query(
            `
            UPDATE users
            SET status = $1
            WHERE id = $2
            RETURNING id, fullname, status
            `,
            [status.toLowerCase(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng."
            });
        }

        res.json({
            success: true,
            message: `Cập nhật trạng thái khách hàng thành '${status}' thành công!`,
            customer: result.rows[0]
        });
    } catch (err) {
        console.error("Update customer status error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật trạng thái khách hàng."
        });
    }
};

// ======================================
// DELETE CUSTOMER
// DELETE /api/admin/customers/:id
// ======================================
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng để xóa."
            });
        }

        res.json({
            success: true,
            message: "Xóa tài khoản khách hàng thành công!"
        });
    } catch (err) {
        console.error("Delete customer error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi xóa tài khoản khách hàng."
        });
    }
};

module.exports = {
    getDashboardStats,
    getCustomers,
    updateCustomerStatus,
    deleteCustomer
};
