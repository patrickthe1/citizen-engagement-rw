/**
 * Controller for agency-related public data.
 * Currently, only includes retrieving a list of all agencies.
 */

const { Agency } = require('../models');

// Controller for agency-related endpoints
const agencyController = {
    // GET /api/agencies - Get all agencies
    getAllAgencies: async (req, res) => {
        try {
            const agencies = await Agency.findAll({
                attributes: ['id', 'name', 'contact_email', 'contact_information'] // Added contact_information
            });
            
            return res.status(200).json({
                success: true,
                data: agencies // Consistent data wrapper
            });
        } catch (error) {
            console.error('Error retrieving agencies:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve agencies.', // More specific message
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
            });
        }
    }
};

module.exports = agencyController;
