const express = require("express");

const router = express.Router();

const {

    getCategories,

    getCategoryById,

    addCategory,

    updateCategory,

    deleteCategory,

    exportCategories

} = require("../controllers/categoryController");


// =========================
// EXPORT EXCEL
// =========================

router.get(
    "/export",
    exportCategories
);


// =========================
// GET ALL
// =========================

router.get(
    "/",
    getCategories
);


// =========================
// GET BY ID
// =========================

router.get(
    "/:id",
    getCategoryById
);


// =========================
// CREATE
// =========================

router.post(
    "/",
    addCategory
);


// =========================
// UPDATE
// =========================

router.put(
    "/:id",
    updateCategory
);


// =========================
// DELETE
// =========================

router.delete(
    "/:id",
    deleteCategory
);

module.exports = router;