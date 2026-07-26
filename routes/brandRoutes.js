const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand
} = require("../controllers/brandController");

// GET /api/brands - Get all brands
router.get("/", getBrands);

// POST /api/brands - Create brand with logo upload
router.post("/", upload.single("logo"), createBrand);

// PUT /api/brands/:id - Update brand
router.put("/:id", upload.single("logo"), updateBrand);

// DELETE /api/brands/:id - Delete brand
router.delete("/:id", deleteBrand);

module.exports = router;