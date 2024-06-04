const express = require('express');
const { register, login, requestOTP, verifyOTP, changePassword } = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate'); // Assume you have this middleware

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/change-password', authenticate, changePassword);

module.exports = router;