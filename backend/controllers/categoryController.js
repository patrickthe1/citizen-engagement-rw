const { Category } = require('../models');

// Controller for category-related endpoints
const categoryController = {
    // GET /api/categories - Get all categories
    getAllCategories: async (req, res) => {
        try {
            // TODO: Retrieve categories from DB using ORM
            const categories = await Category.findAll({
                attributes: ['id', 'name', 'description']
            });
            
            return res.status(200).json({
                success: true,
                categories
            });
        } catch (error) {
            // TODO: Implement error handling
            console.error('Error retrieving categories:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve categories',
                error: error.message
            });
        }
    }
};

module.exports = categoryController;
