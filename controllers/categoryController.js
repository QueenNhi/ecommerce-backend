const db = require("../config/db");
const ExcelJS = require("exceljs");

// =========================
// GET ALL CATEGORIES
// =========================

const getCategories = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                c.id,
                c.name,
                c.description,
                c.created_at,
                COUNT(p.id) AS total_products
            FROM categories c
            LEFT JOIN products p
                ON p.category_id = c.id
            GROUP BY c.id
            ORDER BY c.id
        `);

        res.json(result.rows);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =========================
// GET CATEGORY BY ID
// =========================

const getCategoryById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(
            `SELECT *
             FROM categories
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Category not found."
            });

        }

        res.json(result.rows[0]);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =========================
// ADD CATEGORY
// =========================

const addCategory = async (req, res) => {

    try {

        const { name, description } = req.body;

        const result = await db.query(

            `INSERT INTO categories
            (name, description)
            VALUES ($1,$2)
            RETURNING *`,

            [name, description]

        );

        res.json(result.rows[0]);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =========================
// UPDATE CATEGORY
// =========================

const updateCategory = async (req, res) => {

    try {

        const { id } = req.params;

        const { name, description } = req.body;

        const result = await db.query(

            `UPDATE categories
             SET
             name=$1,
             description=$2
             WHERE id=$3
             RETURNING *`,

            [
                name,
                description,
                id
            ]

        );

        res.json(result.rows[0]);

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

// =========================
// DELETE CATEGORY
// =========================

const deleteCategory = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(

            `DELETE FROM categories
             WHERE id=$1`,

            [id]

        );

        res.json({

            success: true,

            message: "Deleted successfully."

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
// EXPORT EXCEL
// =========================

const exportCategories = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                c.id,
                c.name,
                c.description,
                COUNT(p.id) AS total_products
            FROM categories c
            LEFT JOIN products p
            ON p.category_id = c.id
            GROUP BY c.id
            ORDER BY c.id
        `);

        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet("Categories");

        worksheet.columns = [

            {
                header: "ID",
                key: "id",
                width: 10
            },

            {
                header: "Category",
                key: "name",
                width: 35
            },

            {
                header: "Description",
                key: "description",
                width: 50
            },

            {
                header: "Products",
                key: "total_products",
                width: 15
            }

        ];

        result.rows.forEach(item => {

            worksheet.addRow(item);

        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=categories.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {

    getCategories,

    getCategoryById,

    addCategory,

    updateCategory,

    deleteCategory,

    exportCategories

};