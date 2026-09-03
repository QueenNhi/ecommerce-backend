-- ============================================================
-- INVENTORY MANAGEMENT - DATABASE MIGRATION
-- Heritage Luxury E-Commerce Project
-- ============================================================
-- Chạy script này 1 lần duy nhất trên PostgreSQL database
-- để bổ sung trigger tự động cập nhật trạng thái sản phẩm
-- khi stock_quantity thay đổi.
-- ============================================================

-- 1. Tạo hàm trigger kiểm tra stock và tự động đổi status
CREATE OR REPLACE FUNCTION fn_update_product_status_on_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Khi stock <= 0: đổi status thành 'Out of Stock'
    IF NEW.stock_quantity <= 0 THEN
        NEW.status := 'Out of Stock';
    -- Khi stock > 0 mà status đang là 'Out of Stock': phục hồi thành 'Active'
    ELSIF NEW.stock_quantity > 0 AND OLD.status = 'Out of Stock' THEN
        NEW.status := 'Active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Xóa trigger cũ nếu tồn tại (để tránh conflict khi chạy lại)
DROP TRIGGER IF EXISTS trg_product_stock_status ON products;

-- 3. Tạo trigger BEFORE UPDATE trên bảng products
CREATE TRIGGER trg_product_stock_status
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION fn_update_product_status_on_stock();

-- 4. Cập nhật ngay lập tức tất cả sản phẩm có stock <= 0
UPDATE products
SET status = 'Out of Stock'
WHERE stock_quantity <= 0 AND status != 'Out of Stock';

-- 5. (Optional) Kiểm tra kết quả
-- SELECT id, name, stock_quantity, status FROM products ORDER BY stock_quantity ASC LIMIT 20;

-- ============================================================
-- COMPLETE: Trigger đã được tạo thành công.
-- Mỗi khi stock_quantity được UPDATE, trigger sẽ tự động:
--   - Set status = 'Out of Stock' nếu stock <= 0
--   - Phục hồi status = 'Active' nếu stock > 0 và đang Out of Stock
-- ============================================================
