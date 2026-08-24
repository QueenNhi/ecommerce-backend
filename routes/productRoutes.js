const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const {
    getProducts,
    getAllProducts,
    getProductById,
    getProductImages,
    getProductColors,
    getProductSizes,
    createProduct,
    updateProduct,
    deleteProduct,
    exportProducts,
    filterProducts
} = require("../controllers/productController");

const { getProductReviews, addProductReview } = require("../controllers/reviewController");

// ================= HOME & PUBLIC =================
router.get("/", getProducts);

// ================= SHOP (Đưa các route tĩnh lên TRƯỚC :id) =================
router.get("/all", getAllProducts);
router.get("/filter", filterProducts);
router.get("/export", verifyToken, verifyAdmin, exportProducts);

// ================= CREATE (ADMIN) =================
router.post(
    "/",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    createProduct
);

// ================= PRODUCT DETAIL & SUB-ROUTES =================
// Đưa các route có chứa /:id/ xuống PHÍA DƯỚI các route tĩnh
router.get("/:id/images", getProductImages);
router.get("/:id/colors", getProductColors);
router.get("/:id/sizes", getProductSizes);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", verifyToken, addProductReview);

// Cuối cùng mới đến route get theo ID chung
router.get("/:id", getProductById);

// ================= UPDATE (ADMIN) =================
router.put(
    "/:id",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    updateProduct
);

// ================= DELETE (ADMIN) =================
router.delete("/:id", verifyToken, verifyAdmin, deleteProduct);

module.exports = router;