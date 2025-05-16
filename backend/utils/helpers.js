const { Sequelize } = require('sequelize');
// Using direct import to avoid circular dependency
const { sequelize } = require('../config/database');

// Helper functions for the application

/**
 * Generates a unique ticket ID for a new submission
 * Format: CE-YYYYMMDD-XXXXX (CE for Citizen Engagement, date, and a sequential number)
 */
const generateTicketId = async () => {
    try {
        // Get current date in YYYYMMDD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        // Get count of submissions for today to create sequential number
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));
          // Query directly to avoid circular dependency
        const [results] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM submissions 
            WHERE created_at BETWEEN :startDate AND :endDate
        `, {
            replacements: { 
                startDate: todayStart,
                endDate: todayEnd
            },
            type: Sequelize.QueryTypes.SELECT
        });
        
        const todaySubmissions = results ? parseInt(results.count, 10) : 0;
        
        const sequentialNumber = String(todaySubmissions + 1).padStart(5, '0');
        
        return `CE-${dateStr}-${sequentialNumber}`;
    } catch (error) {
        console.error('Error generating ticket ID:', error);
        // Fallback to a timestamp-based ID if there's an error
        const timestamp = Date.now();
        return `CE-${timestamp}`;
    }
};

module.exports = {
    generateTicketId
};
