// backend/config/db.js

const { Pool } = require("pg");

const pool = new Pool({

    host: "localhost",

    port: 5432,

    user: "postgres",

    password: "2005", // Thay bằng mật khẩu PostgreSQL

    database: "luxurybagstore",

});

pool.connect()
    .then(() => {

        console.log("✅ PostgreSQL Connected");

    })
    .catch((err) => {

        console.error("❌ PostgreSQL Error:", err.message);

    });

module.exports = pool;