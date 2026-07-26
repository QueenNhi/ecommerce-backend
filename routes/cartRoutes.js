const express = require("express");

const router = express.Router();


const {

    getCart,

    addToCart,

    updateCart,

    removeItem,

    clearCart,

    getCartCount,

    getCartTotal,

    checkCart


} = require("../controllers/cartController");




// =================================
// ADD TO CART
// POST /api/cart/add
// =================================

router.post(
    "/add",
    addToCart
);




// =================================
// UPDATE QUANTITY
// PUT /api/cart/update
// =================================

router.put(
    "/update",
    updateCart
);




// =================================
// REMOVE ITEM
// DELETE /api/cart/remove/:id
// =================================

router.delete(
    "/remove/:id",
    removeItem
);




// =================================
// CLEAR CART
// DELETE /api/cart/clear/:userId
// =================================

router.delete(
    "/clear/:userId",
    clearCart
);




// =================================
// CART COUNT
// GET /api/cart/count/:userId
// =================================

router.get(
    "/count/:userId",
    getCartCount
);




// =================================
// CART TOTAL
// GET /api/cart/total/:userId
// =================================

router.get(
    "/total/:userId",
    getCartTotal
);




// =================================
// CHECK CART
// GET /api/cart/check/:userId
// =================================

router.get(
    "/check/:userId",
    checkCart
);




// =================================
// GET CART
// GET /api/cart/:userId
// LUÔN ĐỂ CUỐI
// =================================

router.get(
    "/:userId",
    getCart
);



module.exports = router;