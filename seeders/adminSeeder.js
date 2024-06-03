const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { createUserTable, dbConfig } = require('../models/userModel');
const dotenv = require('dotenv');

const initializeDatabase = async () => {
    // Load environment variables
    const dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const connection = await mysql.createConnection(dbConfig);
    await createUserTable();

    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    await connection.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ('Admin', 'admin@example.com', ?, 'admin')
         ON DUPLICATE KEY UPDATE email=email;`,
        [hashedPassword]
    );
    await connection.end();
};

module.exports = initializeDatabase;
