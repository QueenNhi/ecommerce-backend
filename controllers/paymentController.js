const db = require("../config/db");
const { createVnpayPaymentUrl, verifyVnpayCallback } = require("../services/vnpayService");
const { sendPaymentSuccessEmail, sendOrderConfirmedEmail } = require("../services/emailService");

// ======================================
// CREATE VNPAY PAYMENT URL
// POST /api/payment/vnpay_create_url
// ======================================
const createVnpayUrl = async (req, res) => {
    try {
        const { orderId, amount, bankCode } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin mã đơn hàng (orderId)."
            });
        }

        // Check order in database
        const orderRes = await db.query(
            "SELECT id, total_price, fullname FROM orders WHERE id = $1",
            [orderId]
        );

        if (orderRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng."
            });
        }

        const order = orderRes.rows[0];
        const paymentAmount = amount || order.total_price;
        const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1";

        const paymentUrl = createVnpayPaymentUrl({
            orderId: order.id,
            amount: paymentAmount,
            orderInfo: `Thanh toan don hang HERITAGE LX-${order.id}`,
            ipAddr,
            bankCode
        });

        res.json({
            success: true,
            paymentUrl
        });

    } catch (err) {
        console.error("Create VNPAY URL error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi tạo cổng thanh toán VNPAY."
        });
    }
};

// ======================================
// VNPAY RETURN CALLBACK
// GET /api/payment/vnpay_return
// ======================================
const vnpayReturn = async (req, res) => {
    try {
        const result = verifyVnpayCallback(req.query);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        if (result.isSuccess && result.orderId) {
            // Update order status to paid & processing
            const updateRes = await db.query(
                `
                UPDATE orders
                SET payment_status = 'paid', order_status = 'processing'
                WHERE id = $1
                RETURNING id, user_id, fullname, phone, address, total_price, payment_method, order_status
                `,
                [result.orderId]
            );

            if (updateRes.rows.length > 0) {
                const order = updateRes.rows[0];

                // Fetch user email
                const userRes = await db.query(
                    "SELECT id, fullname, email FROM users WHERE id = $1",
                    [order.user_id]
                );
                const user = userRes.rows[0] || { email: order.phone, fullname: order.fullname };

                // Trigger Emails asynchronously
                sendPaymentSuccessEmail(user, order);
                sendOrderConfirmedEmail(user, order);
            }

            return res.redirect(`${frontendUrl}/payment/vnpay-return?vnp_ResponseCode=00&orderId=${result.orderId}`);
        } else {
            return res.redirect(`${frontendUrl}/payment/vnpay-return?vnp_ResponseCode=${result.responseCode || "99"}&orderId=${result.orderId || ""}`);
        }
    } catch (err) {
        console.error("VNPAY Return error:", err);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/payment/vnpay-return?vnp_ResponseCode=99`);
    }
};

// ======================================
// VNPAY IPN CALLBACK
// GET /api/payment/vnpay_ipn
// ======================================
const vnpayIpn = async (req, res) => {
    try {
        const result = verifyVnpayCallback(req.query);

        if (!result.isValid) {
            return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
        }

        const orderRes = await db.query("SELECT id, payment_status FROM orders WHERE id = $1", [result.orderId]);
        if (orderRes.rows.length === 0) {
            return res.status(200).json({ RspCode: "01", Message: "Order not found" });
        }

        const order = orderRes.rows[0];
        if (order.payment_status === "paid") {
            return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
        }

        if (result.isSuccess) {
            await db.query("UPDATE orders SET payment_status = 'paid', order_status = 'processing' WHERE id = $1", [result.orderId]);
            return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
        } else {
            return res.status(200).json({ RspCode: "00", Message: "Confirm Success (Payment Failed)" });
        }
    } catch (err) {
        console.error("VNPAY IPN error:", err);
        return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
};

module.exports = {
    createVnpayUrl,
    vnpayReturn,
    vnpayIpn
};
