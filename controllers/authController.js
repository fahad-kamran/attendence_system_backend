const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbConfig } = require('../models/userModel');
const { sendOTPEmail } = require('../utils/emailService');

require('dotenv').config();

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await connection.end();
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await connection.end();
    }
};

const requestOTP = async (req, res) => {
    const { email } = req.body;

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await connection.execute(
            'UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?',
            [otp, otpExpiry, email]
        );

        await sendOTPEmail(email, otp);
        res.status(200).json({ message: 'OTP sent to your email', otpExpiry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await connection.end();
    }
};

const verifyOTP = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ? AND otp = ?', [email, otp]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = rows[0];
        if (new Date(user.otp_expiry) < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.execute(
            'UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?',
            [hashedPassword, email]
        );

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await connection.end();
    }
};

const changePassword = async (req, res) => {
    const { userId } = req.user; // Assuming you have middleware that sets req.user
    const { previousPassword, newPassword } = req.body;

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(previousPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await connection.end();
    }
};

module.exports = { register, login, requestOTP, verifyOTP, changePassword };