const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

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

module.exports = {
    register,
    login,
    profile
};