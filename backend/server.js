/**
 * Main server setup file for the Citizen Engagement System backend.
 * Initializes Express, configures middleware (JSON parsing, URL encoding, CORS, sessions),
 * sets up API routes, database connection testing, and global error handling.
 */

const express = require('express');
const session = require('express-session');
const apiRoutes = require('./routes/api');
const { testConnection } = require('./config/database');

// Only load dotenv in non-production environments
// This is duplicated from database.js as a safeguard, in case server.js is loaded first
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_insecure_session_secret_for_dev', // Use an environment variable for the secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Simple welcome route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Citizen Engagement System API',
        version: '1.0.0'
    });
});

// API routes
app.use('/api', apiRoutes);

// Test database connection
testConnection();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : (err.expose ? err.message : 'An unexpected error occurred')
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});