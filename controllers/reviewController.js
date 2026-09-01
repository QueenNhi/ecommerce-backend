const db = require("../config/db");

// ======================================
// GET ALL REVIEWS (ADMIN)
// GET /api/admin/reviews
// ======================================
const getReviews = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                reviews.id,
                reviews.product_id,
                reviews.user_id,
                reviews.rating,
                reviews.comment,
                reviews.created_at,
                products.name AS product_name,
                products.image_url AS product_image,
                users.fullname AS user_fullname,
                users.email AS user_email
            FROM reviews
            LEFT JOIN products ON reviews.product_id = products.id
            LEFT JOIN users ON reviews.user_id = users.id
            ORDER BY reviews.id DESC
        `);

        res.json({
            success: true,
            reviews: result.rows
        });
    } catch (err) {
        console.error("Get reviews error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách đánh giá."
        });
    }
};

// ======================================
// DELETE REVIEW (ADMIN)
// DELETE /api/admin/reviews/:id
// ======================================
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query("DELETE FROM reviews WHERE id = $1 RETURNING id", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đánh giá để xóa."
            });
        }

        res.json({
            success: true,
            message: "Xóa đánh giá thành công!"
        });
    } catch (err) {
        console.error("Delete review error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi xóa đánh giá."
        });
    }
};

// ======================================
// GET REVIEWS FOR A PRODUCT (PUBLIC)
// GET /api/products/:productId/reviews
// ======================================
const getProductReviews = async (req, res) => {
    try {
        const productId = req.params.id;
        const result = await db.query(
            `
            SELECT 
                reviews.id,
                reviews.rating,
                reviews.comment,
                reviews.created_at,
                users.fullname AS user_fullname,
                users.avatar AS user_avatar
            FROM reviews
            LEFT JOIN users ON reviews.user_id = users.id
            WHERE reviews.product_id = $1
            ORDER BY reviews.id DESC
            `,
            [productId]
        );

        const statsResult = await db.query(
            `
            SELECT 
                ROUND(COALESCE(AVG(rating), 0)::numeric, 1) AS average_rating,
                COUNT(*) AS total_reviews
            FROM reviews
            WHERE product_id = $1
            `,
            [productId]
        );

        const stats = statsResult.rows[0];
        const totalReviews = parseInt(stats.total_reviews, 10) || 0;
        
        // Sửa lỗi: Nếu không có review nào thì averageRating = 0
        const averageRating = totalReviews === 0 ? 0 : (parseFloat(stats.average_rating) || 0);

        res.json({
            success: true,
            averageRating: averageRating,
            totalReviews: totalReviews,
            reviews: result.rows
        });
    } catch (err) {
        console.error("Get product reviews error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi lấy danh sách đánh giá sản phẩm."
        });
    }
};

// ======================================
// ADD REVIEW FOR A PRODUCT (PUBLIC)
// POST /api/products/:productId/reviews
// ======================================
// ======================================
// ADD REVIEW FOR A PRODUCT (PUBLIC)
// POST /api/products/:productId/reviews
// ======================================
const addProductReview = async (req, res) => {
    try {
        const productId = req.params.id;
        const { user_id = 1, rating = 5, comment = "" } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Số sao đánh giá từ 1 đến 5."
            });
        }

        if (!comment || comment.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập nội dung đánh giá."
            });
        }

        // Xử lý chuyển đổi an toàn: Đảm bảo user_id phải là số nguyên (integer) tương thích với DB
        let numericUserId = Number(user_id);

        if (isNaN(numericUserId)) {
            // Sửa lại chỉ truy vấn dựa trên các cột chắc chắn có trong bảng users (ví dụ: email hoặc id::text)
            const userLookup = await db.query(
                "SELECT id FROM users WHERE email = $1::text OR id::text = $1",
                [user_id]
            );
            
            if (userLookup.rows.length > 0) {
                numericUserId = userLookup.rows[0].id;
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Thông tin tài khoản không hợp lệ để đánh giá."
                });
            }
        }

        await db.query(
            `
            INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            `,
            [productId, numericUserId, rating, comment.trim()]
        );

        res.status(201).json({
            success: true,
            message: "Cảm ơn bạn đã đóng góp đánh giá cho sản phẩm!"
        });
    } catch (err) {
        console.error("Add product review error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Lỗi gửi đánh giá sản phẩm."
        });
    }
};

module.exports = {
    getReviews,
    deleteReview,
    getProductReviews,
    addProductReview
};