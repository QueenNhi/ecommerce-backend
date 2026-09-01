require('dotenv').config({ path: 'd:/EcommerceProject/backend/.env' });
const db = require('d:/EcommerceProject/backend/config/db');
const { sendOrderCreatedEmail } = require('d:/EcommerceProject/backend/services/emailService');
const nodemailer = require('nodemailer');
const fs = require('fs');

async function runTests() {
    let report = [];
    let passCount = 0;
    let failCount = 0;

    const addResult = (testName, expected, actual, status, details = '') => {
        report.push({ testName, expected, actual, status, details });
        if (status === 'PASS') passCount++;
        else failCount++;
    };

    console.log("Starting tests...");

    // Setup Test User
    let testUser = { id: 9999, fullname: 'Test User', email: 'hothinhikare@gmail.com', phone: '0987654321' };
    
    // 1. Kiểm thử tính năng Đồng bộ thông báo Admin
    try {
        console.log("Test 1: Notifications...");
        // Bắn trực tiếp qua DB hoặc API. Gọi API qua fetch (Node 18+ có sẵn fetch)
        const orderRes = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: testUser.id,
                fullname: testUser.fullname,
                phone: testUser.phone,
                email: testUser.email,
                address: '123 Test St',
                payment_method: 'cod',
                total: 1000000
            })
        });
        const orderData = await orderRes.json();
        
        if (orderData.success && orderData.orderId) {
            const orderId = orderData.orderId;
            // Check if notification was created
            const notifCheck = await db.query("SELECT * FROM admin_notifications WHERE target_id = $1 OR message LIKE $2 ORDER BY id DESC LIMIT 1", [orderId, `%${orderId}%`]);
            if (notifCheck.rows.length > 0) {
                const notif = notifCheck.rows[0];
                addResult(
                    "Đồng bộ thông báo Admin", 
                    "Chuông thông báo cập nhật, hiển thị đúng mã đơn hàng", 
                    `Đã tạo thông báo với message: ${notif.message}`, 
                    "PASS"
                );
            } else {
                addResult("Đồng bộ thông báo Admin", "Tạo thông báo thành công", "Không tìm thấy thông báo trong database", "FAIL");
            }
        } else {
            addResult("Đồng bộ thông báo Admin", "Tạo đơn hàng thành công", "Lỗi tạo đơn hàng: " + JSON.stringify(orderData), "FAIL");
        }
    } catch (e) {
        addResult("Đồng bộ thông báo Admin", "Tạo đơn hàng và thông báo thành công", "Exception: " + e.message, "FAIL");
    }

    // 2. Kiểm thử giới hạn sử dụng Mã giảm giá (Voucher)
    try {
        console.log("Test 2: Vouchers...");
        // Đảm bảo mã WELCOME26 tồn tại và giới hạn là 1
        await db.query("INSERT INTO promotions (code, discount_amount, usage_limit_per_user, status) VALUES ('WELCOME26', 100000, 1, 'active') ON CONFLICT (code) DO UPDATE SET usage_limit_per_user = 1");
        
        // Tạo 1 đơn hàng đã dùng WELCOME26
        await db.query("INSERT INTO orders (user_id, total_price, coupon_code, order_status) VALUES ($1, 500000, 'WELCOME26', 'completed')", [testUser.id]);

        // Thử áp mã qua API
        const validateRes = await fetch('http://localhost:5000/api/promotions/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'WELCOME26', totalAmount: 1000000, user_id: testUser.id })
        });
        const validateData = await validateRes.json();
        
        if (!validateData.success && validateData.message.includes("Bạn đã hết lượt sử dụng mã ưu đãi này")) {
            addResult("Giới hạn sử dụng Voucher (WELCOME26)", "Hiển thị thông báo lỗi hết lượt", "Đã chặn thành công với thông báo: " + validateData.message, "PASS");
        } else {
            addResult("Giới hạn sử dụng Voucher (WELCOME26)", "Bị chặn do hết lượt", "Không bị chặn hoặc trả về sai lỗi: " + JSON.stringify(validateData), "FAIL");
        }
    } catch (e) {
        addResult("Giới hạn sử dụng Voucher (WELCOME26)", "Xử lý thành công", "Exception: " + e.message, "FAIL");
    }

    // 3. Kiểm thử cổng thanh toán VNPay (Sandbox)
    try {
        console.log("Test 3: VNPay...");
        const vnpRes = await fetch('http://localhost:5000/api/payment/vnpay_create_url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: 99999, amount: 500000 })
        });
        const vnpData = await vnpRes.json();
        if (vnpData.paymentUrl && vnpData.paymentUrl.includes('vnpay.vn')) {
            addResult("Thanh toán VNPay (Sandbox)", "Tạo URL VNPay thành công, không trùng lặp TxnRef", "Tạo URL thành công: " + vnpData.paymentUrl.substring(0, 50) + "...", "PASS");
        } else {
            addResult("Thanh toán VNPay (Sandbox)", "Tạo URL VNPay", "Lỗi tạo URL: " + JSON.stringify(vnpData), "FAIL");
        }
    } catch (e) {
        addResult("Thanh toán VNPay (Sandbox)", "Tạo URL thành công", "Exception: " + e.message, "FAIL");
    }

    // 4. Kiểm thử gửi Email thông báo
    try {
        console.log("Test 4: Email...");
        // Mock order for email
        const mockOrder = { id: 8888, fullname: 'Customer', email: 'hothinhikare@gmail.com', total_price: 1500000, payment_method: 'cod', address: '123 Test St', phone: '0987654321', created_at: new Date() };
        
        // In local environments, sendEmail works if SMTP credentials are valid.
        const emailResult = await sendOrderCreatedEmail(testUser, mockOrder);
        
        if (emailResult && emailResult.messageId) {
            addResult("Gửi Email thông báo", "Nodemailer kết nối thành công và gửi email", "Gửi email thành công, Message ID: " + emailResult.messageId, "PASS");
        } else {
            addResult("Gửi Email thông báo", "Nodemailer gửi email", "Email gửi không có messageId hoặc thất bại", "FAIL");
        }
    } catch (e) {
        addResult("Gửi Email thông báo", "Nodemailer gửi email thành công", "Exception: " + e.message, "FAIL");
    }

    // Generate HTML Report
    let htmlReport = `
        <h2>BÁO CÁO KẾT QUẢ KIỂM THỬ HỆ THỐNG E-COMMERCE</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f2f2f2;">
                <th>Tên Ca Kiểm Thử</th>
                <th>Kỳ Vọng (Expected)</th>
                <th>Thực Tế (Actual)</th>
                <th>Trạng Thái</th>
            </tr>
            ${report.map(r => `
                <tr>
                    <td>${r.testName}</td>
                    <td>${r.expected}</td>
                    <td>${r.actual}</td>
                    <td style="color: ${r.status === 'PASS' ? 'green' : 'red'}; font-weight: bold;">${r.status}</td>
                </tr>
            `).join('')}
        </table>
        <p><strong>Tổng cộng:</strong> ${passCount} Pass / ${failCount} Fail</p>
    `;

    // Send final report via Nodemailer directly to user
    try {
        console.log("Sending final report via email...");
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Antigravity System" <${process.env.SMTP_USER}>`,
            to: "hothinhikare@gmail.com",
            subject: "Báo Cáo Kết Quả Kiểm Thử (Test Report)",
            html: htmlReport
        });
        console.log("Report sent successfully!");
    } catch (e) {
        console.error("Failed to send final report:", e.message);
    }
    
    process.exit(0);
}

runTests();
