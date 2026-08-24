const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand
} = require("../controllers/brandController");

// GET /api/brands - Công khai danh sách thương hiệu
router.get("/", getBrands);

// POST /api/brands - Tạo thương hiệu mới (Admin)
router.post("/", verifyToken, verifyAdmin, upload.single("logo"), createBrand);

// PUT /api/brands/:id - Cập nhật thương hiệu (Admin)
router.put("/:id", verifyToken, verifyAdmin, upload.single("logo"), updateBrand);

// DELETE /api/brands/:id - Xóa thương hiệu (Admin)
router.delete("/:id", verifyToken, verifyAdmin, deleteBrand);

module.exports = router;