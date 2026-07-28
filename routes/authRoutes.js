const express = require("express");
const router = express.Router();

const {
    register,
    login,
    profile,
    forgotPassword,
    resetPassword,
    googleLogin
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);

// FORGOT & RESET PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// GOOGLE SYNC LOGIN
router.post("/google-login", googleLogin);

module.exports = router;