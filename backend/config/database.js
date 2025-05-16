// Database configuration for the Citizen Engagement System
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a Sequelize instance for PostgreSQL connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'citizen_engagement_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = {
    sequelize,
    testConnection
};
