const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

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

// ================= HOME =================
router.get("/", getProducts);

// ================= SHOP =================
router.get("/all", getAllProducts);

// FilterProducts
router.get("/filter", filterProducts);

// ================= EXPORT =================
router.get("/export", exportProducts);

// ================= CREATE =================
router.post(
    "/",
    upload.single("image"),
    createProduct
);

// ================= UPDATE =================
router.put(
    "/:id",
    upload.single("image"),
    updateProduct
);

// ================= DELETE =================
router.delete("/:id", deleteProduct);

// ================= PRODUCT REVIEWS =================
router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", addProductReview);

// ================= PRODUCT IMAGES =================
router.get("/:id/images", getProductImages);

// ================= PRODUCT COLORS =================
router.get("/:id/colors", getProductColors);

// ================= PRODUCT SIZES =================
router.get("/:id/sizes", getProductSizes);

// ================= PRODUCT DETAIL =================
router.get("/:id", getProductById);

module.exports = router;