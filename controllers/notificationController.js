const db = require("../config/db");

// Lấy danh sách thông báo cho Admin
const getAdminNotifications = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, type, reference_id, message, is_read, created_at 
             FROM admin_notifications 
             ORDER BY created_at DESC 
             LIMIT 20`
        );
        
        const notifications = result.rows.map(row => ({
            id: row.id,
            type: row.type,
            reference_id: row.reference_id,
            message: row.message,
            isRead: row.is_read,
            created_at: row.created_at
        }));
        
        const unreadCount = notifications.filter(n => !n.isRead).length;
        
        res.json({ success: true, unreadCount, notifications });
    } catch (err) {
        console.error("Lỗi lấy thông báo admin:", err);
        res.status(500).json({ success: false, message: "Lỗi Server khi lấy thông báo." });
    }
};

// Đánh dấu thông báo đã đọc
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            `UPDATE admin_notifications SET is_read = true WHERE id = $1`, 
            [id]
        );
        res.json({ success: true, message: "Đã đánh dấu đọc thành công." });
    } catch (err) {
        console.error("Lỗi đánh dấu đọc thông báo:", err);
        res.status(500).json({ success: false, message: "Lỗi Server." });
    }
};

module.exports = { getAdminNotifications, markAsRead };
