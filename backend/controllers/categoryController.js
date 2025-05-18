/**
 * Controller for category-related public data.
 * Currently, only includes retrieving a list of all categories.
 */

const { Category } = require('../models');

const categoryController = {
    // GET /api/categories - Get all categories
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.findAll({
                attributes: ['id', 'name', 'description']
            });
            
            return res.status(200).json({
                success: true,
                data: categories // Consistent data wrapper
            });
        } catch (error) {
            console.error('Error retrieving categories:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve categories.', // More specific message
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
            });
        }
    }
};

module.exports = categoryController;
