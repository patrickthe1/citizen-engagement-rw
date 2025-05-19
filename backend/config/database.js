// Database configuration for the Citizen Engagement System
const { Sequelize } = require('sequelize');

// Only load dotenv in non-production environments
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
    console.log('Loaded dotenv configuration for development environment');
}

// Log database connection information for debugging
console.log('DB Connection String being used:', process.env.DATABASE_URL ? 'URL_IS_SET' : 'URL_NOT_SET', process.env.NODE_ENV);

let sequelize;

// Prioritize DATABASE_URL for production environments (like Render)
if (process.env.DATABASE_URL) {
    console.log('Attempting to connect using DATABASE_URL...');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for Render PostgreSQL SSL connections
            }
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
} else {
    console.log('DATABASE_URL not set, falling back to separate environment variables...');
    // Fall back to individual connection parameters for local development
    sequelize = new Sequelize(
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
}

// Test database connection
const testConnection = async () => {
    try {
        console.log(`Attempting to connect to database in ${process.env.NODE_ENV || 'unknown'} environment...`);
        console.log(`Using connection method: ${process.env.DATABASE_URL ? 'DATABASE_URL' : 'Individual parameters'}`);
        
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
            console.error('ERROR: DATABASE_URL environment variable is not set in production environment!');
        }
    }
};

module.exports = {
    sequelize,
    testConnection
};
