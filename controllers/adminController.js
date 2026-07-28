const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { SECRET } = require("../utils/jwt");

// ======================================
// GET DASHBOARD STATS
// GET /api/admin/stats
// Phân quyền dữ liệu theo role (Admin / Sale / Warehouse)
// ======================================
const getDashboardStats = async (req, res) => {
    try {
        let role = "customer";

        // 1. Giải mã token từ Authorization header nếu có
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                if (token) {
                    const decoded = jwt.verify(token, SECRET);
                    if (decoded && decoded.role) {
                        role = String(decoded.role).toLowerCase().trim();
                    }
                }
            } catch (e) {
                // Token không hợp lệ hoặc hết hạn
            }
        }

        // 2. Kiểm tra req.user từ middleware (nếu có)
        if (role === "customer" && req.user && req.user.role) {
            role = String(req.user.role).toLowerCase().trim();
        }

        // 3. Fallback qua x-user-role header hoặc query string
        if (role === "customer") {
            const headerRole = req.headers["x-user-role"] || req.query.role;
            if (headerRole) {
                role = String(headerRole).toLowerCase().trim();
            }
        }

        // Chuẩn hóa alias role
        if (role === "sales") role = "sale";
        if (role === "manager") role = "admin";

        // Chặn Customer hoặc role không hợp lệ
        if (!["admin", "sale", "warehouse"].includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Truy cập bị từ chối. Bạn không có quyền xem thông tin Dashboard."
            });
        }

        // ====================================================
        // 1. ROLE ADMIN (TOÀN QUYỀN: Doanh thu, đơn hàng, khách hàng, sản phẩm, top bán chạy)
        // ====================================================
        if (role === "admin") {
            const revenueRes = await db.query(
                "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE order_status != 'cancelled'"
            );
            const totalRevenue = parseFloat(revenueRes.rows[0].total);

            const ordersRes = await db.query("SELECT COUNT(*) AS total FROM orders");
            const totalOrders = parseInt(ordersRes.rows[0].total, 10);

            const productsRes = await db.query("SELECT COUNT(*) AS total FROM products");
            const totalProducts = parseInt(productsRes.rows[0].total, 10);

            const customersRes = await db.query(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'customer' OR role IS NULL"
            );
            const totalCustomers = parseInt(customersRes.rows[0].total, 10);

            const recentOrdersRes = await db.query(`
                SELECT id, fullname, phone, address, total_price, payment_method, order_status, created_at
                FROM orders
                ORDER BY id DESC
                LIMIT 5
            `);

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

            const statusRes = await db.query(`
                SELECT order_status, COUNT(*) AS count
                FROM orders
                GROUP BY order_status
            `);

            return res.json({
                success: true,
                role: "admin",
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
        }

        // ====================================================
        // 2. ROLE SALE (CHỈ ĐƠN HÀNG VÀ KHÁCH HÀNG)
        // KHÔNG trả về: Doanh thu, Top sản phẩm bán chạy, Biểu đồ tài chính
        // ====================================================
        if (role === "sale") {
            const pendingRes = await db.query(
                "SELECT COUNT(*) AS total FROM orders WHERE order_status = 'pending'"
            );
            const pendingOrders = parseInt(pendingRes.rows[0].total, 10);

            const processingRes = await db.query(
                "SELECT COUNT(*) AS total FROM orders WHERE order_status = 'processing'"
            );
            const processingOrders = parseInt(processingRes.rows[0].total, 10);

            const completedTodayRes = await db.query(
                "SELECT COUNT(*) AS total FROM orders WHERE order_status = 'completed' AND created_at >= CURRENT_DATE"
            );
            const completedTodayOrders = parseInt(completedTodayRes.rows[0].total, 10);

            const newCustomersRes = await db.query(
                "SELECT COUNT(*) AS total FROM users WHERE (role = 'customer' OR role IS NULL) AND created_at >= CURRENT_DATE - INTERVAL '30 days'"
            );
            const newCustomersCount = parseInt(newCustomersRes.rows[0].total, 10);

            const totalCustomersRes = await db.query(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'customer' OR role IS NULL"
            );
            const totalCustomers = parseInt(totalCustomersRes.rows[0].total, 10);

            const recentOrdersRes = await db.query(`
                SELECT id, fullname, phone, address, order_status, created_at
                FROM orders
                ORDER BY id DESC
                LIMIT 5
            `);

            const statusRes = await db.query(`
                SELECT order_status, COUNT(*) AS count
                FROM orders
                GROUP BY order_status
            `);

            return res.json({
                success: true,
                role: "sale",
                stats: {
                    pendingOrders,
                    processingOrders,
                    completedTodayOrders,
                    newCustomersCount,
                    totalCustomers,
                    recentOrders: recentOrdersRes.rows,
                    statusBreakdown: statusRes.rows
                }
            });
        }

        // ====================================================
        // 3. ROLE WAREHOUSE (CHỈ SẢN PHẨM & TỒN KHO & ĐƠN CẦN XUẤT KHO)
        // KHÔNG trả về: Doanh thu, Khách hàng, Top sản phẩm bán chạy, Biểu đồ tài chính
        // ====================================================
        if (role === "warehouse") {
            const productsRes = await db.query("SELECT COUNT(*) AS total FROM products");
            const totalProducts = parseInt(productsRes.rows[0].total, 10);

            const lowStockRes = await db.query(
                "SELECT COUNT(*) AS total FROM products WHERE stock_quantity > 0 AND stock_quantity <= 5"
            );
            const lowStockCount = parseInt(lowStockRes.rows[0].total, 10);

            const outOfStockRes = await db.query(
                "SELECT COUNT(*) AS total FROM products WHERE stock_quantity <= 0"
            );
            const outOfStockCount = parseInt(outOfStockRes.rows[0].total, 10);

            const pendingDispatchRes = await db.query(
                "SELECT COUNT(*) AS total FROM orders WHERE order_status IN ('pending', 'processing')"
            );
            const pendingDispatchCount = parseInt(pendingDispatchRes.rows[0].total, 10);

            const lowStockListRes = await db.query(`
                SELECT id, name, stock_quantity, image_url, status
                FROM products
                WHERE stock_quantity <= 5
                ORDER BY stock_quantity ASC
                LIMIT 6
            `);

            const pendingDispatchListRes = await db.query(`
                SELECT id, fullname, phone, order_status, created_at
                FROM orders
                WHERE order_status IN ('pending', 'processing')
                ORDER BY id DESC
                LIMIT 5
            `);

            return res.json({
                success: true,
                role: "warehouse",
                stats: {
                    totalProducts,
                    lowStockCount,
                    outOfStockCount,
                    pendingDispatchCount,
                    lowStockList: lowStockListRes.rows,
                    pendingDispatchList: pendingDispatchListRes.rows
                }
            });
        }

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
