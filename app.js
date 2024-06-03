const express = require('express');
const { createUserTable } = require('./models/userModel');
const authRoutes = require('./routes/authRoutes');
const dotenv = require('dotenv');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Ensure the users table exists
createUserTable().then(() => {
    console.log('Users table ensured');
}).catch((err) => {
    console.error('Error ensuring users table:', err);
});

// Use the auth routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
