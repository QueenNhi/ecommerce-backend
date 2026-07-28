const express = require("express");
const router = express.Router();

const {
    createVnpayUrl,
    vnpayReturn,
    vnpayIpn
} = require("../controllers/paymentController");

// POST /api/payment/vnpay_create_url
router.post("/vnpay_create_url", createVnpayUrl);

// GET /api/payment/vnpay_return
router.get("/vnpay_return", vnpayReturn);

// GET /api/payment/vnpay_ipn
router.get("/vnpay_ipn", vnpayIpn);

module.exports = router;
