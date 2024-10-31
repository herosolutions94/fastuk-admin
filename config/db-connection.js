const {DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME,DB_PORT} = process.env;


const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    connectionLimit: 10,
    user: DB_USERNAME,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
});

module.exports = pool;