const { Agency } = require('../models');

// Controller for agency-related endpoints
const agencyController = {
    // GET /api/agencies - Get all agencies
    getAllAgencies: async (req, res) => {
        try {
            // TODO: Retrieve agencies from DB using ORM
            const agencies = await Agency.findAll({
                attributes: ['id', 'name', 'contact_email']
            });
            
            return res.status(200).json({
                success: true,
                agencies
            });
        } catch (error) {
            // TODO: Implement error handling
            console.error('Error retrieving agencies:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve agencies',
                error: error.message
            });
        }
    }
};

module.exports = agencyController;
