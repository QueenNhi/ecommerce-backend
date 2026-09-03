const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const authRoutes = require("./routes/authRoutes");

// 🌟 1. IMPORT FILE aiRoutes
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================
// MIDDLEWARE & CORS
// =====================================
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-user-role"] // <--- Đã thêm x-user-role vào đây
}));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// =====================================
// HEALTH CHECK FOR RENDER / VERCEL
// =====================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Heritage Luxury API is running successfully!",
        version: "1.0.0"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// =====================================
// STATIC
// =====================================
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// =====================================
// ROUTES
// =====================================
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/admin/brands", brandRoutes);

// 🌟 2. ĐĂNG KÝ ĐƯỜNG DẪN /api/ai
app.use("/api/ai", aiRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", orderRoutes);

// Auth
app.use("/api/auth", authRoutes);

// Admin Stats
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Admin Notifications
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/admin/notifications", notificationRoutes);

// Payment Routes (VNPAY & Banking)
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);

// Admin & Public Promotions & Coupons
const promotionRoutes = require("./routes/promotionRoutes");
app.use("/api/promotions", promotionRoutes);
app.use("/api/admin/promotions", promotionRoutes);
app.use("/api/admin/coupons", promotionRoutes);

const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/admin/reviews", reviewRoutes);

// Admin Settings & Collections
const settingsRoutes = require("./routes/settingsRoutes");
app.use("/api/admin/settings", settingsRoutes);

const collectionRoutes = require("./routes/collectionRoutes");
app.use("/api/admin/collections", collectionRoutes);

// Admin Staff Management
const staffRoutes = require("./routes/staffRoutes");
app.use("/api/admin/staff", staffRoutes);

// Inventory Management
const inventoryRoutes = require("./routes/inventoryRoutes");
app.use("/api/admin/inventory", inventoryRoutes);

// =====================================
// 404
// =====================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Not Found"
    });
});

// =====================================
// SERVER
// =====================================
app.listen(PORT, () => {
    if (process.env.NODE_ENV === "production") {
        console.log(`🚀 Server running on port ${PORT}`);
    } else {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    }
});