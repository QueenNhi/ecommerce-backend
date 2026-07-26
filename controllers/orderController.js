const db = require("../config/db");

// ======================================
// CREATE ORDER
// POST /api/orders
// ======================================
const createOrder = async (req, res) => {
    try {
        const {
            user_id = 1,
            fullname,
            phone,
            email,
            address,
            payment_method = "cod",
            note = ""
        } = req.body;

        if (!fullname || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin giao hàng."
            });
        }

        const userId = user_id || 1;

        // 1. Get user cart
        const cartResult = await db.query(
            "SELECT id FROM cart WHERE user_id = $1",
            [userId]
        );

        if (cartResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Giỏ hàng đang trống."
            });
        }

        const cartId = cartResult.rows[0].id;

        // 2. Get cart items
        const itemsResult = await db.query(
            `
            SELECT 
                cart_items.product_id,
                cart_items.color_id,
                cart_items.size_id,
                cart_items.quantity,
                products.price
            FROM cart_items
            JOIN products ON cart_items.product_id = products.id
            WHERE cart_items.cart_id = $1
            `,
            [cartId]
        );

        if (itemsResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Giỏ hàng đang trống."
            });
        }

        const items = itemsResult.rows;

        // 3. Calculate total
        const totalPrice = items.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        const fullAddress = `${address}`;

        // 4. Insert order
        const orderResult = await db.query(
            `
            INSERT INTO orders (user_id, fullname, phone, address, note, total_price, payment_method, order_status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
            RETURNING id, fullname, phone, address, total_price, payment_method, created_at
            `,
            [userId, fullname, phone, fullAddress, note, totalPrice, payment_method]
        );

        const order = orderResult.rows[0];

        // 5. Insert order items
        for (const item of items) {
            await db.query(
                `
                INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price)
                VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [order.id, item.product_id, item.color_id, item.size_id, item.quantity, item.price]
            );
        }

        // 6. Clear cart items
        await db.query(
            "DELETE FROM cart_items WHERE cart_id = $1",
            [cartId]
        );

        res.status(201).json({
            success: true,
            message: "Đặt hàng thành công!",
            orderId: order.id,
            order
        });

    } catch (err) {
        console.error("Create order error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi tạo đơn hàng."
        });
    }
};

// ======================================
// GET ORDER BY ID
// GET /api/orders/:id
// ======================================
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await db.query(
            `
            SELECT id, user_id, fullname, phone, address, note, total_price, payment_method, order_status, created_at
            FROM orders
            WHERE id = $1
            `,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng."
            });
        }

        const order = orderResult.rows[0];

        const itemsResult = await db.query(
            `
            SELECT 
                order_items.id,
                order_items.quantity,
                order_items.price,
                products.id AS product_id,
                products.name,
                products.image_url,
                product_colors.color_name,
                product_sizes.size_name
            FROM order_items
            JOIN products ON order_items.product_id = products.id
            LEFT JOIN product_colors ON order_items.color_id = product_colors.id
            LEFT JOIN product_sizes ON order_items.size_id = product_sizes.id
            WHERE order_items.order_id = $1
            ORDER BY order_items.id ASC
            `,
            [id]
        );

        res.json({
            success: true,
            order,
            items: itemsResult.rows
        });

    } catch (err) {
        console.error("Get order error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy thông tin đơn hàng."
        });
    }
};

// ======================================
// GET ALL ORDERS (ADMIN)
// GET /api/orders/admin/all
// ======================================
const getAllOrders = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT 
                orders.id,
                orders.user_id,
                orders.fullname,
                orders.phone,
                orders.address,
                orders.note,
                orders.total_price,
                orders.payment_method,
                orders.order_status,
                orders.created_at,
                COALESCE(SUM(order_items.quantity), 0) AS total_items
            FROM orders
            LEFT JOIN order_items ON orders.id = order_items.order_id
            GROUP BY orders.id
            ORDER BY orders.id DESC
            `
        );

        res.json({
            success: true,
            orders: result.rows
        });
    } catch (err) {
        console.error("Get all orders error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách đơn hàng."
        });
    }
};

// ======================================
// UPDATE ORDER STATUS (ADMIN)
// PUT /api/orders/:id/status
// ======================================
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "processing", "shipping", "completed", "cancelled"];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái đơn hàng không hợp lệ."
            });
        }

        const result = await db.query(
            `
            UPDATE orders
            SET order_status = $1
            WHERE id = $2
            RETURNING id, order_status
            `,
            [status.toLowerCase(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng."
            });
        }

        res.json({
            success: true,
            message: `Cập nhật trạng thái đơn hàng thành '${status}' thành công!`,
            order: result.rows[0]
        });
    } catch (err) {
        console.error("Update order status error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi cập nhật trạng thái đơn hàng."
        });
    }
};

// ======================================
// GET USER ORDERS
// GET /api/orders/user/:userId
// ======================================
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query(
            `
            SELECT 
                orders.id,
                orders.total_price,
                orders.payment_method,
                orders.order_status,
                orders.created_at,
                COALESCE(SUM(order_items.quantity), 0) AS total_items
            FROM orders
            LEFT JOIN order_items ON orders.id = order_items.order_id
            WHERE orders.user_id = $1
            GROUP BY orders.id
            ORDER BY orders.id DESC
            `,
            [userId]
        );

        res.json({
            success: true,
            orders: result.rows
        });
    } catch (err) {
        console.error("Get user orders error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách đơn hàng người dùng."
        });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    getUserOrders
};
