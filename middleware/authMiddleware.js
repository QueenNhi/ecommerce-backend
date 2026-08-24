const jwt = require("jsonwebtoken");
const { SECRET } = require("../utils/jwt");

// Middleware xác thực Token JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Vui lòng cung cấp mã xác thực Token hợp lệ."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Token không hợp lệ hoặc đã hết hạn."
        });
    }
};

// Middleware kiểm tra quyền hạn tùy chỉnh
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Người dùng chưa được xác thực."
            });
        }

        const userRole = (req.user.role || "").toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole) && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Bạn không có quyền thực hiện chức năng này."
            });
        }

        next();
    };
};

// Middleware kiểm tra quyền Admin
const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Người dùng chưa được xác thực."
        });
    }

    const role = (req.user.role || "").toLowerCase();
    const isAdmin = role === "admin" || role === "manager" || req.user.isAdmin || req.user.is_admin;

    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: Bạn không có quyền truy cập hệ thống quản trị."
        });
    }

    next();
};

// Xuất mặc định là verifyToken cho khả năng tương thích ngược
module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.verifyAdmin = verifyAdmin;
module.exports.checkRole = checkRole;