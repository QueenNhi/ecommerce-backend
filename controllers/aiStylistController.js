require("dotenv").config(); 

const getOutfitRecommendation = async (req, res) => {
    try {
        const { productName, productCategory, productDescription, productColor } = req.body;

        if (!productName) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin sản phẩm." });
        }

        const prompt = `
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

        // Gọi OpenRouter API trực tiếp qua chuẩn fetch của Node.js
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
        
        // Dọn dẹp chuỗi JSON trả về
        textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        const recommendations = JSON.parse(textResponse);

        return res.json({
            success: true,
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

module.exports = { getOutfitRecommendation };