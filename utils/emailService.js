// utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // use your email service
    auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_EMAIL_PASSWORD
    }
});

const sendOTPEmail = (email, otp) => {
    const mailOptions = {
        from: process.env.MY_EMAIL,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };