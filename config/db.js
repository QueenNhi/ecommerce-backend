// backend/config/db.js

require("dotenv").config();
const { Pool } = require("pg");

console.log("DATABASE_URL:");
console.log(process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Mỗi khi tạo connection mới -> đặt schema mặc định là public
pool.on("connect", async (client) => {
    try {
        await client.query("SET search_path TO public;");
        console.log("✅ search_path = public");
    } catch (err) {
        console.error("❌ Cannot set search_path:", err.message);
    }
});

// Test kết nối
(async () => {
    try {
        const client = await pool.connect();

        console.log("✅ Connected to Neon PostgreSQL");

        const info = await client.query(`
            SELECT
                current_database() AS database,
                current_schema() AS schema,
                current_setting('search_path') AS search_path;
        `);

        console.table(info.rows);

        const tables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public'
            ORDER BY table_name;
        `);

        console.log("📋 Tables:");
        console.table(tables.rows);

        const categories = await client.query(`
            SELECT COUNT(*) AS total
            FROM categories;
        `);

        console.log("📂 Categories:");
        console.table(categories.rows);

        client.release();
    } catch (err) {
        console.error("❌ PostgreSQL Error:");
        console.error(err);
    }
})();

module.exports = pool;