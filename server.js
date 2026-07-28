const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const authRoutes = require("./routes/authRoutes");

// 🌟 1. BẠN PHẢI IMPORT FILE aiRoutes VÀO ĐÂY (Mình vừa thêm dòng này):
const aiRoutes = require("./routes/aiRoutes"); 

const app = express();
const PORT = 5000;

// =====================================
// MIDDLEWARE
// =====================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

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

// 🌟 2. BẠN PHẢI ĐĂNG KÝ ĐƯỜNG DẪN /api/ai VÀO ĐÂY (Mình vừa thêm dòng này):
app.use("/api/ai", aiRoutes); 

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", orderRoutes);

// Auth
app.use("/api/auth", authRoutes);

// Admin Stats
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Payment Routes (VNPAY & Banking)
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);

// Admin Promotions & Reviews
const promotionRoutes = require("./routes/promotionRoutes");
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

// =====================================
// 404
// =====================================
app.use((req,res)=>{
    res.status(404).json({
        success:false,
        message:"API Not Found"
    });
});

// =====================================
// SERVER
// =====================================
app.listen(PORT,()=>{
    console.log(
        `🚀 Server running at http://localhost:${PORT}`
    );
});