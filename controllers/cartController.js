const db = require("../config/db");


// ======================================
// GET CART
// GET /api/cart/:userId
// ======================================

const getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId - hỗ trợ cả số nguyên (DB user) và chuỗi (Google Auth UID)
        if (!userId || userId === 'undefined' || userId === 'null') {
            return res.json([]);
        }

        const cartResult = await db.query(
            `SELECT id FROM cart WHERE user_id = $1`,
            [String(userId)]
        );

        if (cartResult.rows.length === 0) {
            return res.json([]);
        }

        const cartId = cartResult.rows[0].id;

        const result = await db.query(
            `
            SELECT
                cart_items.id,
                cart_items.quantity,
                products.id AS product_id,
                products.name,
                products.price,
                products.image_url,
                product_colors.color_name,
                product_sizes.size_name
            FROM cart_items
            JOIN products ON cart_items.product_id = products.id
            LEFT JOIN product_colors ON cart_items.color_id = product_colors.id
            LEFT JOIN product_sizes ON cart_items.size_id = product_sizes.id
            WHERE cart_items.cart_id = $1
            ORDER BY cart_items.id DESC
            `,
            [cartId]
        );

        res.json(result.rows);
    } catch(err) {
        console.error('getCart error:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi lấy giỏ hàng.' });
    }
};





// ======================================
// ADD TO CART
// POST /api/cart/add
// ======================================

const addToCart = async(req, res) => {
    try {
        const { user_id, product_id, color_id, size_id, quantity } = req.body;

        // Validate
        if (!user_id || user_id === 'undefined' || user_id === 'null') {
            return res.status(400).json({ success: false, message: 'user_id không hợp lệ.' });
        }
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'product_id là bắt buộc.' });
        }

        const safeUserId = String(user_id);

        let cartResult = await db.query(
            'SELECT id FROM cart WHERE user_id = $1',
            [safeUserId]
        );

        let cartId;
        if (cartResult.rows.length === 0) {
            const newCart = await db.query(
                'INSERT INTO cart(user_id) VALUES($1) RETURNING id',
                [safeUserId]
            );
            cartId = newCart.rows[0].id;
        } else {
            cartId = cartResult.rows[0].id;
        }

        const existed = await db.query(
            `SELECT id FROM cart_items
             WHERE cart_id = $1 AND product_id = $2
             AND (color_id = $3 OR (color_id IS NULL AND $3 IS NULL))
             AND (size_id = $4 OR (size_id IS NULL AND $4 IS NULL))`,
            [cartId, product_id, color_id || null, size_id || null]
        );

        if (existed.rows.length > 0) {
            await db.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
                [quantity || 1, existed.rows[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO cart_items(cart_id, product_id, color_id, size_id, quantity) VALUES($1, $2, $3, $4, $5)',
                [cartId, product_id, color_id || null, size_id || null, quantity || 1]
            );
        }

        res.json({ success: true, message: 'Đã thêm vào giỏ hàng' });
    } catch(err) {
        console.error('addToCart error:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi thêm vào giỏ hàng.' });
    }
};





// ======================================
// UPDATE QUANTITY
// PUT /api/cart/update
// ======================================

const updateCart = async(req, res) => {
    try{
        const {
            id,
            quantity
        } = req.body;

        if(quantity <= 0){
            await db.query(
                `
                DELETE FROM cart_items
                WHERE id = $1
                `,
                [id]
            );

            return res.json({
                success: true,
                message: "Đã xóa sản phẩm"
            });
        }

        await db.query(
            `
            UPDATE cart_items
            SET quantity = $1
            WHERE id = $2
            `,
            [
                quantity,
                id
            ]
        );

        res.json({
            success: true,
            message: "Cập nhật số lượng thành công"
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};





// ======================================
// REMOVE ITEM
// DELETE /api/cart/remove/:id
// ======================================

const removeItem = async(req, res) => {
    try{
        const { id } = req.params;

        await db.query(
            `
            DELETE FROM cart_items
            WHERE id = $1
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Đã xóa sản phẩm"
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};





// ======================================
// CLEAR CART
// DELETE /api/cart/clear/:userId
// ======================================

const clearCart = async(req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || userId === 'undefined' || userId === 'null') {
            return res.status(400).json({ success: false, message: 'userId không hợp lệ.' });
        }

        await db.query(
            `DELETE FROM cart_items
             WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1)`,
            [String(userId)]
        );

        res.json({ success: true, message: 'Đã làm trống giỏ hàng' });
    } catch(err) {
        console.error('clearCart error:', err.message);
        res.status(500).json({ success: false, message: 'Lỗi xóa giỏ hàng.' });
    }
};





// ======================================
// CART COUNT
// GET /api/cart/count/:userId
// ======================================

const getCartCount = async(req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId - trả 0 thay vì crash nếu userId không hợp lệ
        if (!userId || userId === 'undefined' || userId === 'null') {
            return res.json({ count: 0 });
        }

        const result = await db.query(
            `SELECT COALESCE(SUM(ci.quantity), 0) AS count
             FROM cart_items ci
             JOIN cart c ON ci.cart_id = c.id
             WHERE c.user_id = $1`,
            [String(userId)]
        );

        res.json({ count: Number(result.rows[0]?.count || 0) });
    } catch(err) {
        console.error('getCartCount error:', err.message);
        // Trả về 0 thay vì 500 error để tránh crash Header
        res.json({ count: 0 });
    }
};





// ======================================
// CART TOTAL
// GET /api/cart/total/:userId
// ======================================

const getCartTotal = async(req, res) => {
    try{
        const { userId } = req.params;

        const result = await db.query(
            `
            SELECT
            COALESCE(
            SUM(products.price * cart_items.quantity)
            , 0)
            AS total
            FROM cart_items
            JOIN products
            ON cart_items.product_id = products.id
            WHERE cart_id =
            (
                SELECT id
                FROM cart
                WHERE user_id = $1
            )
            `,
            [userId]
        );

        res.json({
            total: Number(result.rows[0]?.total || 0)
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};





// ======================================
// CHECK CART BEFORE CHECKOUT
// GET /api/cart/check/:userId
// ======================================

const checkCart = async(req, res) => {
    try{
        const { userId } = req.params;

        const result = await db.query(
            `
            SELECT COUNT(*) 
            FROM cart_items
            WHERE cart_id =
            (
                SELECT id
                FROM cart
                WHERE user_id = $1
            )
            `,
            [userId]
        );

        const count = Number(result.rows[0]?.count || 0);

        if(count === 0){
            return res.status(400).json({
                success: false,
                message: "Giỏ hàng đang trống"
            });
        }

        res.json({
            success: true
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};





module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeItem,
    clearCart,
    getCartCount,
    getCartTotal,
    checkCart
};