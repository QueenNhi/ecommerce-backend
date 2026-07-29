require("dotenv").config();
const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || "";
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || "";
const defaultFrom = process.env.EMAIL_FROM || (smtpUser ? `"Heritage Luxury Handbags" <${smtpUser}>` : '"Heritage Luxury" <no-reply@heritageluxury.vn>');

console.log(`📧 Nodemailer SMTP initialized — Host: ${smtpHost}:${smtpPort}, User: ${smtpUser ? smtpUser : '(not set)'}, Pass length: ${smtpPass ? smtpPass.length : 0}`);

// Configure Transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: smtpUser,
        pass: smtpPass
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    pool: true,
    maxConnections: 5,
    maxMessages: 100,

    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((err, success) => {
    console.log("====================================");
    console.log("📧 SMTP VERIFY");
    console.log("Host:", smtpHost);
    console.log("Port:", smtpPort);
    console.log("User:", smtpUser);

    if (err) {
        console.error("❌ SMTP VERIFY FAILED");
        console.error(err);
    } else {
        console.log("✅ SMTP READY");
    }

    console.log("====================================");
});


/**
 * Generates luxury responsive HTML email layout
 */
const buildLuxuryEmailTemplate = ({ title, subtitle, bodyContentHtml, ctaUrl, ctaText }) => {
    const year = new Date().getFullYear();
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { margin: 0; padding: 0; background-color: #faf9f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6; }
            .email-container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .header { background-color: #0f172a; padding: 36px 20px; text-align: center; border-bottom: 2px solid #8b6b2d; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 4px; text-transform: uppercase; }
            .header span { display: block; font-size: 10px; color: #d4a853; letter-spacing: 2px; margin-top: 6px; text-transform: uppercase; }
            .banner { background-color: #fdfbf7; padding: 24px 30px; text-align: center; border-bottom: 1px solid #f1f5f9; }
            .banner h2 { margin: 0 0 6px; font-size: 20px; color: #8b6b2d; font-weight: 700; }
            .banner p { margin: 0; font-size: 13px; color: #64748b; }
            .content { padding: 32px 30px; }
            .cta-wrapper { text-align: center; margin: 30px 0 10px; }
            .btn-cta { display: inline-block; padding: 14px 32px; background-color: #8b6b2d; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 8px; box-shadow: 0 4px 15px rgba(139,107,45,0.3); }
            .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
            .footer a { color: #8b6b2d; text-decoration: none; }
            .table-items { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            .table-items th { background-color: #f8fafc; color: #0f172a; padding: 10px; text-align: left; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
            .table-items td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .price-highlight { color: #8b6b2d; font-weight: 700; font-size: 16px; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>HERITAGE</h1>
                <span>Luxury Handbag Collection</span>
            </div>
            <div class="banner">
                <h2>${title}</h2>
                ${subtitle ? `<p>${subtitle}</p>` : ""}
            </div>
            <div class="content">
                ${bodyContentHtml}
                ${ctaUrl && ctaText ? `
                    <div class="cta-wrapper">
                        <a href="${ctaUrl}" class="btn-cta">${ctaText}</a>
                    </div>
                ` : ""}
            </div>
            <div class="footer">
                <p>&copy; ${year} Heritage Luxury Portfolio. All rights reserved.</p>
                <p>Khám phá sản phẩm cao cấp tại <a href="${siteUrl}">${siteUrl}</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generic mail sender (safe, non-blocking with detailed diagnosis)
 */
const sendMail = async ({ to, subject, html }) => {
    if (!to || !to.includes("@")) {
        console.log("⚠️ Invalid email:", to);
        return false;
    }

    if (!smtpUser || !smtpPass) {
        console.log("❌ SMTP chưa cấu hình.");
        return false;
    }

    try {

        // Test SMTP trước
        await transporter.verify();
        console.log("✅ SMTP Connected");

        const info = await transporter.sendMail({
            from: defaultFrom,
            to,
            subject,
            html
        });

        console.log("======================================");
        console.log("📧 EMAIL SENT SUCCESS");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("MessageId:", info.messageId);
        console.log("======================================");

        return true;

    } catch (err) {

        console.log("======================================");
        console.log("❌ EMAIL SEND FAILED");
        console.log("Code:", err.code);
        console.log("Command:", err.command);
        console.log("Message:", err.message);
        console.log("Response:", err.response);
        console.log("======================================");

        return false;
    }
};
// ======================================
// 1. REGISTER WELCOME EMAIL
// ======================================
const sendWelcomeEmail = async (user) => {
    const title = "Chào Mừng Quý Khách Đã Đăng Ký Tài Khoản";
    const subtitle = "Khám phá di sản nghệ thuật may túi xách thủ công độc bản";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    const bodyContentHtml = `
        <p>Xin chào <strong>${user.fullname || "Quý khách"}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Heritage Luxury</strong>. Bạn đã chính thức trở thành thành viên thân thiết của thương hiệu túi xách cao cấp hàng đầu.</p>
        <p>Giờ đây bạn có thể lưu danh sách yêu thích, theo dõi đơn hàng và nhận những đặc quyền mua sắm giới hạn.</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/products`,
        ctaText: "Khám Phá Bộ Sưu Tập Ngay"
    });

    return sendMail({
        to: user.email,
        subject: "[Heritage Luxury] 💎 Chào mừng quý khách gia nhập Heritage",
        html
    });
};

// ======================================
// 2. FORGOT PASSWORD EMAIL
// ======================================
const sendForgotPasswordEmail = async (user, resetToken) => {
    const title = "Yêu Cầu Đặt Lại Mật Khẩu";
    const subtitle = "Liên kết có hiệu lực trong vòng 60 phút";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";
    const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;

    const bodyContentHtml = `
        <p>Xin chào <strong>${user.fullname || "Quý khách"}</strong>,</p>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>${user.email}</strong>.</p>
        <p>Nhấp vào nút bên dưới để tiến hành thiết lập mật khẩu mới an toàn:</p>
        <p style="font-size: 12px; color: #64748b;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: resetUrl,
        ctaText: "Đặt Lại Mật Khẩu Ngay"
    });

    return sendMail({
        to: user.email,
        subject: "[Heritage Luxury] 🔐 Yêu cầu đặt lại mật khẩu tài khoản",
        html
    });
};

// ======================================
// 3. PASSWORD RESET SUCCESS EMAIL
// ======================================
const sendPasswordResetSuccessEmail = async (user) => {
    const title = "Mật Khẩu Đã Đổi Thành Công";
    const subtitle = "Tài khoản của bạn đã được cập nhật mật khẩu mới";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    const bodyContentHtml = `
        <p>Xin chào <strong>${user.fullname || "Quý khách"}</strong>,</p>
        <p>Mật khẩu tài khoản Heritage Luxury của bạn đã được thay đổi thành công vào lúc ${new Date().toLocaleString("vi-VN")}.</p>
        <p>Nếu bạn không phải là người thực hiện thay đổi này, hãy liên hệ ngay với bộ phận hỗ trợ của chúng tôi.</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/login`,
        ctaText: "Đăng Nhập Ngay"
    });

    return sendMail({
        to: user.email,
        subject: "[Heritage Luxury] ✅ Mật khẩu của bạn đã được cập nhật",
        html
    });
};

// ======================================
// 4. ORDER CREATED EMAIL
// ======================================
const sendOrderCreatedEmail = async (user, order, items = []) => {
    const title = `Đặt Hàng Thành Công #${order.id}`;
    const subtitle = "Cảm ơn bạn đã tin tưởng lựa chọn Heritage Luxury";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    let itemsRows = items.map(item => `
        <tr>
            <td><strong>${item.name || "Túi xách Heritage"}</strong></td>
            <td>${item.quantity}</td>
            <td style="text-align: right;">${Number(item.price).toLocaleString("vi-VN")} ₫</td>
        </tr>
    `).join("");

    const bodyContentHtml = `
        <p>Xin chào <strong>${order.fullname || user?.fullname}</strong>,</p>
        <p>Đơn hàng của bạn đã được hệ thống ghi nhận thành công với thông tin chi tiết như sau:</p>
        
        <table class="table-items">
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th style="text-align: right;">Giá tiền</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <p><strong>Tổng thanh toán:</strong> <span class="price-highlight">${Number(order.total_price).toLocaleString("vi-VN")} ₫</span></p>
        <p><strong>Phương thức thanh toán:</strong> ${String(order.payment_method).toUpperCase()}</p>
        <p><strong>Địa chỉ giao hàng:</strong> ${order.address} (${order.phone})</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/orders/${order.id}`,
        ctaText: "Xem Chi Tiết Đơn Hàng"
    });

    return sendMail({
        to: user?.email || order.email,
        subject: `[Heritage Luxury] 🛍️ Xác nhận đơn hàng #${order.id}`,
        html
    });
};

// ======================================
// 5. PAYMENT SUCCESS EMAIL
// ======================================
const sendPaymentSuccessEmail = async (user, order) => {
    const title = `Thanh Toán Thành Công #${order.id}`;
    const subtitle = "Đơn hàng của bạn đã được thanh toán hoàn tất";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    const bodyContentHtml = `
        <p>Xin chào <strong>${order.fullname || user?.fullname}</strong>,</p>
        <p>Chúng tôi đã xác nhận thanh toán thành công cho đơn hàng <strong>#${order.id}</strong>.</p>
        <p><strong>Số tiền đã thanh toán:</strong> <span class="price-highlight">${Number(order.total_price).toLocaleString("vi-VN")} ₫</span></p>
        <p><strong>Phương thức:</strong> ${String(order.payment_method).toUpperCase()}</p>
        <p>Bộ phận chế tác và chuẩn bị hàng sẽ lập tức đóng gói hộp quà sản phẩm cho quý khách.</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/orders/${order.id}`,
        ctaText: "Theo Dõi Đơn Hàng"
    });

    return sendMail({
        to: user?.email || order.email,
        subject: `[Heritage Luxury] 💳 Xác nhận thanh toán thành công đơn hàng #${order.id}`,
        html
    });
};

// ======================================
// 6. ORDER CONFIRMED EMAIL (PROCESSING)
// ======================================
const sendOrderConfirmedEmail = async (user, order) => {
    const title = `Đơn Hàng #${order.id} Đã Được Xác Nhận`;
    const subtitle = "Đang tiến hành chuẩn bị và kiểm định chất lượng";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    const bodyContentHtml = `
        <p>Xin chào <strong>${order.fullname || user?.fullname}</strong>,</p>
        <p>Đơn hàng <strong>#${order.id}</strong> của bạn đã được đội ngũ quản lý xác nhận và đang chuyển sang giai đoạn chuẩn bị hàng.</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/orders/${order.id}`,
        ctaText: "Xem Trạng Thái Đơn Hàng"
    });

    return sendMail({
        to: user?.email || order.email,
        subject: `[Heritage Luxury] ✨ Đơn hàng #${order.id} đã được xác nhận`,
        html
    });
};

// ======================================
// 7. ORDER SHIPPING EMAIL
// ======================================
const sendOrderShippingEmail = async (user, order) => {
    const title = `Đơn Hàng #${order.id} Đang Được Giao`;
    const subtitle = "Sản phẩm đang trên đường tới địa chỉ của bạn";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    const bodyContentHtml = `
        <p>Xin chào <strong>${order.fullname || user?.fullname}</strong>,</p>
        <p>Đơn hàng <strong>#${order.id}</strong> của bạn đã được giao cho đơn vị vận chuyển hỏa tốc.</p>
        <p><strong>Địa chỉ nhận hàng:</strong> ${order.address} (${order.phone})</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/orders/${order.id}`,
        ctaText: "Kiểm Tra Lộ Trình Giao Hàng"
    });

    return sendMail({
        to: user?.email || order.email,
        subject: `[Heritage Luxury] 🚚 Đơn hàng #${order.id} đang được vận chuyển`,
        html
    });
};

// ======================================
// 8. ORDER COMPLETED EMAIL
// ======================================
const sendOrderCompletedEmail = async (user, order) => {
    const title = `Giao Hàng Hoàn Tất #${order.id}`;
    const subtitle = "Cảm ơn quý khách đã trải nghiệm sản phẩm của Heritage Luxury";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    const bodyContentHtml = `
        <p>Xin chào <strong>${order.fullname || user?.fullname}</strong>,</p>
        <p>Đơn hàng <strong>#${order.id}</strong> của bạn đã được giao thành công.</p>
        <p>Hy vọng bạn hài lòng với chất lượng da và sự tỉ mỉ trong từng đường nét chiếc túi xách của mình. Hãy để lại đánh giá trải nghiệm nhé!</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/product/${order.id}`,
        ctaText: "Viết Đánh Giá Sản Phẩm"
    });

    return sendMail({
        to: user?.email || order.email,
        subject: `[Heritage Luxury] 🎉 Giao hàng hoàn tất đơn hàng #${order.id}`,
        html
    });
};

// ======================================
// 9. ORDER CANCELLED EMAIL
// ======================================
const sendOrderCancelledEmail = async (user, order) => {
    const title = `Đơn Hàng #${order.id} Đã Bị Hủy`;
    const subtitle = "Thông báo trạng thái đơn hàng của quý khách";
    const siteUrl = process.env.FRONTEND_URL || "https://ecommerce-project-2qxq.vercel.app";

    const bodyContentHtml = `
        <p>Xin chào <strong>${order.fullname || user?.fullname}</strong>,</p>
        <p>Chúng tôi tiếc rằng đơn hàng <strong>#${order.id}</strong> đã bị hủy.</p>
        <p>Nếu bạn có thắc mắc hoặc cần hỗ trợ thêm, hãy liên hệ với chúng tôi bất cứ lúc nào.</p>
    `;

    const html = buildLuxuryEmailTemplate({
        title,
        subtitle,
        bodyContentHtml,
        ctaUrl: `${siteUrl}/products`,
        ctaText: "Tiếp Tục Mua Sắm"
    });

    return sendMail({
        to: user?.email || order.email,
        subject: `[Heritage Luxury] 🔴 Thông báo hủy đơn hàng #${order.id}`,
        html
    });
};

module.exports = {
    sendWelcomeEmail,
    sendForgotPasswordEmail,
    sendPasswordResetSuccessEmail,
    sendOrderCreatedEmail,
    sendPaymentSuccessEmail,
    sendOrderConfirmedEmail,
    sendOrderShippingEmail,
    sendOrderCompletedEmail,
    sendOrderCancelledEmail
};
