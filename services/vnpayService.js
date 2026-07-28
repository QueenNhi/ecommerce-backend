require("dotenv").config();
const crypto = require("crypto");
const qs = require("qs");

/**
 * Sorts object properties alphabetically by key
 */
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

/**
 * Formats date as YYYYMMDDHHmmss
 */
function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

/**
 * Cleans Vietnamese accents for VNPAY string compatibility
 */
function cleanAccents(str) {
    return String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9\s\-_]/g, "");
}

/**
 * Generates VNPAY payment URL for an order
 */
const createVnpayPaymentUrl = ({ orderId, amount, orderInfo, ipAddr = "127.0.0.1", bankCode = "" }) => {
    const vnpTmnCode = process.env.VNP_TMNCODE || "CGXZR57K";
    const vnpHashSecret = process.env.VNP_HASHSECRET || "RAKDRSU0VTNJRSERGGJZEB7VCH1U07K";
    const vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const vnpReturnUrl = process.env.VNP_RETURNURL || "http://localhost:5000/api/payment/vnpay_return";

    const date = new Date();
    const createDate = formatDate(date);

    // Sanitize IP address (IPv6 ::1 fallback to 127.0.0.1)
    let cleanIp = String(ipAddr || "127.0.0.1").replace(/^.*:/, "");
    if (!cleanIp || cleanIp === "1") cleanIp = "127.0.0.1";

    const cleanInfo = cleanAccents(orderInfo || `Thanh toan don hang HERITAGE LX-${orderId}`);

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = vnpTmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = String(orderId);
    vnp_Params["vnp_OrderInfo"] = cleanInfo;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = Math.round(Number(amount) * 100);
    vnp_Params["vnp_ReturnUrl"] = vnpReturnUrl;
    vnp_Params["vnp_IpAddr"] = cleanIp;
    vnp_Params["vnp_CreateDate"] = createDate;

    if (bankCode) {
        vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl = `${vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;

    console.log("==================================================");
    console.log("💳 [VNPAY DEBUG LOGS]");
    console.log("🔹 VNP_TMNCODE:  ", vnpTmnCode);
    console.log("🔹 VNP_HASHSECRET:", vnpHashSecret ? `${vnpHashSecret.substring(0, 4)}***${vnpHashSecret.substring(vnpHashSecret.length - 4)}` : "(empty)");
    console.log("🔹 VNP_URL:       ", vnpUrl);
    console.log("🔹 VNP_RETURNURL: ", vnpReturnUrl);
    console.log("--------------------------------------------------");
    console.log("📦 Raw VNPAY Params:", JSON.stringify(vnp_Params, null, 2));
    console.log("🔑 Sign Data String:\n", signData);
    console.log("🔒 Calculated SecureHash:", signed);
    console.log("🚀 Final Generated Payment URL:\n", paymentUrl);
    console.log("==================================================");

    return paymentUrl;
};

/**
 * Verifies VNPAY return / IPN callback checksum
 */
const verifyVnpayCallback = (vnp_Params) => {
    const vnpHashSecret = process.env.VNP_HASHSECRET || "RAKDRSU0VTNJRSERGGJZEB7VCH1U07K";

    let params = { ...vnp_Params };
    const secureHash = params["vnp_SecureHash"];

    delete params["vnp_SecureHash"];
    delete params["vnp_SecureHashType"];

    params = sortObject(params);

    const signData = qs.stringify(params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const isValid = secureHash === signed;
    const isSuccess = isValid && params["vnp_ResponseCode"] === "00";

    console.log("🔍 [VNPAY CALLBACK VERIFICATION]");
    console.log("🔹 Received Hash:  ", secureHash);
    console.log("🔹 Calculated Hash:", signed);
    console.log("🔹 Is Valid Hash:  ", isValid);
    console.log("🔹 Response Code:  ", params["vnp_ResponseCode"]);
    console.log("--------------------------------------------------");

    return {
        isValid,
        isSuccess,
        orderId: params["vnp_TxnRef"],
        amount: Number(params["vnp_Amount"]) / 100,
        responseCode: params["vnp_ResponseCode"],
        vnp_Params: params
    };
};

module.exports = {
    createVnpayPaymentUrl,
    verifyVnpayCallback
};
