const db = require("../config/db");
const ExcelJS = require("exceljs");
// =========================
// HOME (15 PRODUCTS)
// =========================

const getProducts = async (req, res) => {

    try {

        const result = await db.query(`
        SELECT *
        FROM products
        ORDER BY id ASC
        LIMIT 15
        `);

        res.json(result.rows);

    } catch (err) {

        res.status(500).json(err);

    }

};

// =========================
// SHOP (ALL PRODUCTS)
// =========================

const getAllProducts = async (req, res) => {

    try {

        const result = await db.query(`
        SELECT *
        FROM products
        ORDER BY id ASC
        `);

        res.json(result.rows);

    } catch (err) {

        res.status(500).json(err);

    }

};

// =========================
// PRODUCT DETAIL
// =========================

const getProductById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(

            `SELECT * FROM products WHERE id = $1`,

            [id]

        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });

        }

        res.json(result.rows[0]);

    } catch (err) {

        res.status(500).json(err);

    }

};

// =========================
// PRODUCT IMAGES
// /images
// /images?color=1
// =========================

const getProductImages = async (req, res) => {

    try {

        const { id } = req.params;

        const { color } = req.query;

        let sql = `
            SELECT *
            FROM product_images
            WHERE product_id = $1
        `;

        let params = [id];

        if (color) {

            sql += ` AND color_id = $2`;

            params.push(color);

        }

        sql += ` ORDER BY sort_order ASC`;

        const result = await db.query(sql, params);

        res.json(result.rows);

    } catch (err) {

        res.status(500).json(err);

    }

};

// =========================
// PRODUCT COLORS
// =========================

const getProductColors = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(

            `SELECT *
             FROM product_colors
             WHERE product_id = $1`,

            [id]

        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json(err);

    }

};

// =========================
// PRODUCT SIZES
// =========================

const getProductSizes = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(

            `SELECT *
             FROM product_sizes
             WHERE product_id = $1`,

            [id]

        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json(err);

    }

};

// =========================
// CREATE PRODUCT
// =========================

const createProduct = async (req, res) => {

    try {

        console.log("===== CREATE PRODUCT =====");
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        const {
            name,
            description,
            price,
            stock_quantity,
            category_id,
            brand_id,
            status
        } = req.body;

        const stock =
            stock_quantity && stock_quantity.trim() !== ""
                ? Number(stock_quantity)
                : 0;

        const category =
            category_id && category_id.trim() !== ""
                ? Number(category_id)
                : null;

        const brand =
            brand_id && brand_id.trim() !== ""
                ? Number(brand_id)
                : null;

        const image_url = req.file
            ? req.file.filename
            : "";

        const result = await db.query(
            `
            INSERT INTO products
            (
                name,
                description,
                price,
                stock_quantity,
                category_id,
                brand_id,
                image_url,
                status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
            `,
            [
                name.trim(),
                description.trim(),
                Number(price),
                stock,
                category,
                brand,
                image_url,
                status
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error("===== CREATE PRODUCT ERROR =====");
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
// =========================
// UPDATE PRODUCT
// =========================

const updateProduct = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            name,
            description,
            price,
            stock_quantity,
            category_id,
            brand_id,
            status
        } = req.body;
        let image_url;

        // Có chọn ảnh mới
        if (req.file) {
        
            image_url = req.file.filename;
        
        } else {
        
            // Giữ ảnh cũ
            const oldProduct = await db.query(
                "SELECT image_url FROM products WHERE id = $1",
                [id]
            );
        
            image_url = oldProduct.rows[0].image_url;
        
        }

        const result = await db.query(
            `
            UPDATE products
            SET
                name=$1,
                description=$2,
                price=$3,
                stock_quantity=$4,
                category_id=$5,
                brand_id=$6,
                image_url=$7,
                status=$8
            WHERE id=$9
            RETURNING *
            `,
            [
                name,
                description,
                price,
                stock_quantity,
                category_id,
                brand_id,
                image_url,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        res.json(result.rows[0]);

    } catch (err) {

        console.log(err);
    
        res.status(500).json(err);
    
    }
    
    };

// =========================
// DELETE PRODUCT
// =========================

const deleteProduct = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(
            `
            DELETE FROM products
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rowCount === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =========================
// EXPORT PRODUCTS
// =========================
const exportProducts = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                id,
                name,
                price,
                stock_quantity,
                category_id,
                brand_id,
                status
            FROM products
            ORDER BY id ASC
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Products");

        worksheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Name", key: "name", width: 35 },
            { header: "Price", key: "price", width: 15 },
            { header: "Stock", key: "stock_quantity", width: 12 },
            { header: "Category", key: "category_id", width: 12 },
            { header: "Brand", key: "brand_id", width: 12 },
            { header: "Status", key: "status", width: 15 }
        ];

        result.rows.forEach(product => {
            worksheet.addRow(product);
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=products.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }

};

// Categories
const filterProducts = async (req, res) => {

    try {

        const {
            category,
            brand,
            price
        } = req.query;

        let sql = `
            SELECT *
            FROM products
            WHERE status='Active'
        `;

        const params = [];

        if (category) {

            params.push(category);

            sql += ` AND category_id=$${params.length}`;

        }

        if (brand) {

            params.push(brand);

            sql += ` AND brand_id=$${params.length}`;

        }

        if (price) {

            switch (price) {

                case "1":
                    sql += ` AND price < 1000000`;
                    break;

                case "2":
                    sql += ` AND price BETWEEN 1000000 AND 10000000`;
                    break;

                case "3":
                    sql += ` AND price BETWEEN 10000000 AND 50000000`;
                    break;

                case "4":
                    sql += ` AND price > 50000000`;
                    break;

            }

        }

        sql += ` ORDER BY created_at DESC`;

        const result = await db.query(sql, params);

        res.json(result.rows);

    } catch (err) {

        console.log(err);

        res.status(500).json(err);

    }

};

module.exports = {

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

};