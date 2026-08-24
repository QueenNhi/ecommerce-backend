const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    getCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory,
    exportCategories
} = require("../controllers/categoryController");

// =========================
// EXPORT EXCEL (ADMIN)
// =========================
router.get(
    "/export",
    verifyToken,
    verifyAdmin,
    exportCategories
);

// =========================
// GET ALL (PUBLIC)
// =========================
router.get(
    "/",
    getCategories
);

// =========================
// GET BY ID (PUBLIC)
// =========================
router.get(
    "/:id",
    getCategoryById
);

// =========================
// CREATE (ADMIN)
// =========================
router.post(
    "/",
    verifyToken,
    verifyAdmin,
    addCategory
);

// =========================
// UPDATE (ADMIN)
// =========================
router.put(
    "/:id",
    verifyToken,
    verifyAdmin,
    updateCategory
);

// =========================
// DELETE (ADMIN)
// =========================
router.delete(
    "/:id",
    verifyToken,
    verifyAdmin,
    deleteCategory
);

module.exports = router;