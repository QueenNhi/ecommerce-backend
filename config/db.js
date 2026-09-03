// backend/config/db.js

require("dotenv").config();
const { Pool } = require("pg");

// Kiểm tra DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined.");
    process.exit(1);
}

console.log("✅ PostgreSQL configuration loaded.");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Chỉ test database khi chạy local
if (process.env.NODE_ENV !== "production") {
    (async () => {
        let client;

        try {
            client = await pool.connect();

            console.log("✅ Connected to Neon PostgreSQL");

            // Thiết lập schema
            await client.query("SET search_path TO public;");

            const info = await client.query(`
                SELECT
                    current_database() AS database,
                    current_schema() AS schema,
                    current_setting('search_path') AS search_path;
            `);

            console.log("📌 Database Info:");
            console.table(info.rows);

            const tables = await client.query(`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
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

        } catch (err) {
            console.error("❌ PostgreSQL Connection Error:");
            console.error(err.message);
        } finally {
            if (client) {
                client.release();
            }
        }
    })();
}

// Export pool directly — pool.query, pool.connect etc. are already available
// via module.exports since module.exports IS the pool object.
// We only add getClient() as a named helper for transaction support.
module.exports = pool;
module.exports.getClient = () => pool.connect();