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

// ================= SHOP (Đưa các route tĩnh lên TRƯỚC :id) =================
router.get("/all", getAllProducts);
router.get("/filter", filterProducts);
router.get("/export", exportProducts);

// ================= CREATE =================
router.post(
    "/",
    upload.single("image"),
    createProduct
);

// ================= PRODUCT DETAIL & SUB-ROUTES =================
// Đưa các route có chứa /:id/ xuống PHÍA DƯỚI các route tĩnh
router.get("/:id/images", getProductImages);
router.get("/:id/colors", getProductColors);
router.get("/:id/sizes", getProductSizes);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", addProductReview);

// Cuối cùng mới đến route get theo ID chung
router.get("/:id", getProductById);

// ================= UPDATE =================
router.put(
    "/:id",
    upload.single("image"),
    updateProduct
);

// ================= DELETE =================
router.delete("/:id", deleteProduct);

module.exports = router;