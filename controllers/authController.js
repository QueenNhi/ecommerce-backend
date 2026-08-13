const pool = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { generateToken } = require("../utils/jwt");
const {
    sendWelcomeEmail,
    sendForgotPasswordEmail,
    sendPasswordResetSuccessEmail
} = require("../services/emailService");

// =========================
// REGISTER
// =========================
const register = async (req, res) => {
    try {
        const {
            fullname,
            email,
            phone,
            password
        } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin."
            });
        }

        // Kiểm tra email tồn tại
        const checkUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({
                message: "Email đã tồn tại."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Thêm user
        const result = await pool.query(
            `
            INSERT INTO users
            (
                fullname,
                email,
                phone,
                password,
                role,
                status,
                avatar,
                address
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                'customer',
                'active',
                '',
                ''
            )
            RETURNING
                id,
                fullname,
                email,
                role
            `,
            [
                fullname,
                email,
                phone,
                hashedPassword
            ]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        // Gửi Email chào mừng (không block response nếu lỗi SMTP)
        sendWelcomeEmail(user);

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công.",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// =========================
// LOGIN
// =========================
const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "Email không tồn tại."
            });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Sai mật khẩu."
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: "Đăng nhập thành công.",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// =========================
// PROFILE
// =========================
const profile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                fullname,
                email,
                phone,
                role
             FROM users
             WHERE id=$1`,
            [req.user.id]
        );

        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

// =========================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =========================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập địa chỉ email."
            });
        }

        const result = await pool.query("SELECT id, fullname, email FROM users WHERE email = $1", [email.toLowerCase().trim()]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản với địa chỉ email này."
            });
        }

        const user = result.rows[0];
        const resetToken = crypto.randomBytes(32).toString("hex");

        await pool.query(
            `
            UPDATE users
            SET reset_password_token = $1,
                reset_password_expires = NOW() + INTERVAL '1 hour'
            WHERE id = $2
            `,
            [resetToken, user.id]
        );

        // Send Email with reset link
        await sendForgotPasswordEmail(user, resetToken);

        res.json({
            success: true,
            message: "Đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn."
        });

    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi yêu cầu quên mật khẩu."
        });
    }
};

// =========================
// RESET PASSWORD
// POST /api/auth/reset-password
// =========================
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Thiếu mã xác nhận hoặc mật khẩu mới."
            });
        }

        const result = await pool.query(
            `
            SELECT id, fullname, email
            FROM users
            WHERE reset_password_token = $1 AND reset_password_expires > NOW()
            `,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
            });
        }

        const user = result.rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `
            UPDATE users
            SET password = $1,
                reset_password_token = NULL,
                reset_password_expires = NULL
            WHERE id = $2
            `,
            [hashedPassword, user.id]
        );

        // Send Email confirmation
        sendPasswordResetSuccessEmail(user);

        res.json({
            success: true,
            message: "Đặt lại mật khẩu thành công. Quý khách có thể đăng nhập ngay."
        });

    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi đặt lại mật khẩu."
        });
    }
};

// =========================
// GOOGLE / FIREBASE LOGIN SYNC
// POST /api/auth/google-login
// =========================
const googleLogin = async (req, res) => {
    try {
        const { email, fullname, avatar } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin Email từ Google."
            });
        }

        const cleanEmail = String(email).toLowerCase().trim();
        let user;

        const checkRes = await pool.query(
            "SELECT id, fullname, email, role, avatar FROM users WHERE email = $1",
            [cleanEmail]
        );

        if (checkRes.rows.length > 0) {
            user = checkRes.rows[0];
            if (!user.avatar && avatar) {
                await pool.query("UPDATE users SET avatar = $1 WHERE id = $2", [avatar, user.id]);
                user.avatar = avatar;
            }
        } else {
            const insertRes = await pool.query(
                `
                INSERT INTO users
                (fullname, email, phone, password, role, status, avatar, address)
                VALUES ($1, $2, '', '', 'customer', 'active', $3, '')
                RETURNING id, fullname, email, role, avatar
                `,
                [fullname || cleanEmail.split("@")[0], cleanEmail, avatar || ""]
            );
            user = insertRes.rows[0];

            // Trigger Welcome Email
            sendWelcomeEmail(user);
        }

        const numericId = Number(user.id);
        const token = generateToken({
            id: numericId,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            message: "Đăng nhập Google thành công.",
            token,
            user: {
                id: numericId,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (err) {
        console.error("Google Login Sync error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi đồng bộ tài khoản Google."
        });
    }
};

module.exports = {
    register,
    login,
    profile,
    forgotPassword,
    resetPassword,
    googleLogin
};