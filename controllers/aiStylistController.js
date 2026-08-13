require("dotenv").config();

// ============================================================
// IN-MEMORY AI RESPONSE CACHE (TTL: 24 GIỜ)
// ============================================================
const aiCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const buildCacheKey = (productName, productCategory, productColor) => {
    const pName = String(productName || "").trim().toLowerCase();
    const pCat = String(productCategory || "").trim().toLowerCase();
    const pCol = String(productColor || "").trim().toLowerCase();
    return `ai_outfit_${pName}_${pCat}_${pCol}`;
};

const getFromCache = (cacheKey) => {
    if (!aiCache.has(cacheKey)) return null;
    const entry = aiCache.get(cacheKey);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        aiCache.delete(cacheKey);
        return null;
    }
    return entry.data;
};

const setToCache = (cacheKey, data) => {
    aiCache.set(cacheKey, {
        timestamp: Date.now(),
        data
    });
};

const cleanJsonString = (rawText) => {
    if (!rawText) return "[]";
    let cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    // Locate array bounds if LLM added intro text
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    return cleaned;
};

const createPrompt = (productName, productCategory, productDescription, productColor) => {
    return `
        Bạn là một stylist thời trang cao cấp, am hiểu sâu sắc về xu hướng thời trang quốc tế. 
        Tôi đang có một chiếc túi xách với thông tin sau:
        - Tên sản phẩm: ${productName}
        - Loại túi: ${productCategory || "Túi xách thời trang"}
        - Màu sắc: ${productColor || "Không rõ"}
        - Mô tả: ${productDescription || "Không có mô tả"}

        Hãy gợi ý cho khách hàng 3 phong cách phối đồ hoàn hảo đi kèm với chiếc túi này. 
        Trả về kết quả hoàn toàn bằng tiếng Việt dưới định dạng JSON thuần túy (không kèm markdown như \`\`\`json) với cấu trúc mảng các object như sau:
        [
            {
                "styleName": "Tên phong cách (VD: Office Chic)",
                "clothingSuggestion": "Gợi ý trang phục chi tiết",
                "shoesAndAccessories": "Gợi ý giày dép và phụ kiện",
                "colorTip": "Lời khuyên về màu sắc",
                "occasion": "Hoàn cảnh phù hợp"
            }
        ]
    `;
};

// ============================================================
// 1. STANDARD HTTP POST ENDPOINT (VỚI CACHING)
// ============================================================
const getOutfitRecommendation = async (req, res) => {
    try {
        const { productName, productCategory, productDescription, productColor } = req.body;

        if (!productName) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin sản phẩm." });
        }

        const cacheKey = buildCacheKey(productName, productCategory, productColor);
        const cachedData = getFromCache(cacheKey);

        if (cachedData) {
            console.log(`⚡ AI CACHE HIT: [${cacheKey}] - Phản hồi tức thì < 5ms`);
            return res.json({
                success: true,
                cached: true,
                recommendations: cachedData
            });
        }

        console.log(`🤖 AI CACHE MISS: [${cacheKey}] - Đang gọi OpenRouter API...`);

        const prompt = createPrompt(productName, productCategory, productDescription, productColor);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "openrouter/free",
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "Lỗi từ OpenRouter API");
        }

        let textResponse = data.choices[0].message.content.trim();
        const cleanedJson = cleanJsonString(textResponse);
        const recommendations = JSON.parse(cleanedJson);

        // Lưu vào cache
        setToCache(cacheKey, recommendations);

        return res.json({
            success: true,
            cached: false,
            recommendations
        });

    } catch (err) {
        console.error("AI Generation Error:", err);
        return res.status(500).json({
            success: false,
            message: "Lỗi AI: " + err.message
        });
    }
};

// ============================================================
// 2. RESPONSE STREAMING (SERVER-SENT EVENTS - SSE) ENDPOINT
// ============================================================
const streamOutfitRecommendation = async (req, res) => {
    const { productName, productCategory, productDescription, productColor } = req.body;

    if (!productName) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin sản phẩm." });
    }

    // Thiết lập Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const sendEvent = (eventData) => {
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    try {
        const cacheKey = buildCacheKey(productName, productCategory, productColor);
        const cachedData = getFromCache(cacheKey);

        if (cachedData) {
            console.log(`⚡ AI SSE CACHE HIT: [${cacheKey}]`);
            sendEvent({ type: "cached", recommendations: cachedData });
            res.write("data: [DONE]\n\n");
            return res.end();
        }

        console.log(`📡 AI SSE STREAM STARTING: [${cacheKey}]`);
        sendEvent({ type: "start", message: "Đang kết nối AI Stylist..." });

        const prompt = createPrompt(productName, productCategory, productDescription, productColor);

        const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openrouter/free",
                "messages": [
                    { "role": "user", "content": prompt }
                ],
                "stream": true
            })
        });

        if (!openrouterRes.ok) {
            const errJson = await openrouterRes.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `OpenRouter Stream Error (${openrouterRes.status})`);
        }

        const reader = openrouterRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith(":")) continue; // Skip comments/keep-alives

                if (trimmedLine.startsWith("data: ")) {
                    const dataStr = trimmedLine.replace(/^data:\s*/, "");

                    if (dataStr === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        const deltaContent = parsed.choices?.[0]?.delta?.content || "";
                        if (deltaContent) {
                            fullText += deltaContent;
                            // Truyền trực tiếp token đến Frontend client qua SSE
                            sendEvent({ type: "chunk", content: deltaContent });
                        }
                    } catch (e) {
                        // Skip invalid parse chunks
                    }
                }
            }
        }

        // Xử lý nốt buffer còn lại
        if (buffer.trim().startsWith("data: ")) {
            const dataStr = buffer.trim().replace(/^data:\s*/, "");
            if (dataStr !== "[DONE]") {
                try {
                    const parsed = JSON.parse(dataStr);
                    const deltaContent = parsed.choices?.[0]?.delta?.content || "";
                    if (deltaContent) fullText += deltaContent;
                } catch (e) {}
            }
        }

        // Phân tích cú pháp JSON kết quả đầy đủ và lưu vào Cache
        let recommendations = [];
        try {
            const cleaned = cleanJsonString(fullText);
            recommendations = JSON.parse(cleaned);
            setToCache(cacheKey, recommendations);
        } catch (parseErr) {
            console.error("Failed to parse streamed AI JSON:", parseErr, fullText);
        }

        sendEvent({
            type: "done",
            recommendations,
            rawText: fullText
        });

        res.write("data: [DONE]\n\n");
        return res.end();

    } catch (err) {
        console.error("AI Stream Error:", err);
        sendEvent({ type: "error", message: err.message || "Lỗi tạo phản hồi AI." });
        res.write("data: [DONE]\n\n");
        return res.end();
    }
};

module.exports = {
    getOutfitRecommendation,
    streamOutfitRecommendation
};