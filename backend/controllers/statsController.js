/**
 * Controller for providing aggregated statistics about submissions.
 * Used for the public-facing dashboard.
 */

const { Submission, Category, sequelize } = require('../models');

const statsController = {
    getStatsSummary: async (req, res) => {
        try {
            const totalSubmissions = await Submission.count();

            const submissionsByStatus = await Submission.findAll({
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('status')), 'count']
                ],
                group: ['status']
            });

            const submissionsByCategory = await Submission.findAll({
                attributes: [
                    // 'category_id', // Not strictly needed in final output if we have category name
                    [sequelize.fn('COUNT', sequelize.col('Submission.id')), 'count'] // Changed to Submission.id
                ],
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['name'] // Include category name
                }],
                group: ['category.id', 'category.name'] // Group by category id and name
            });

            // Format submissionsByStatus for easier consumption
            const formattedStatusCounts = submissionsByStatus.reduce((acc, item) => {
                acc[item.status] = parseInt(item.get('count'), 10);
                return acc;
            }, {});

            // Format submissionsByCategory for easier consumption
            const formattedCategoryCounts = submissionsByCategory.map(item => ({
                category_name: item.category.name,
                count: parseInt(item.get('count'), 10)
            }));

            return res.status(200).json({
                success: true,
                data: {
                    totalSubmissions,
                    submissionsByStatus: formattedStatusCounts,
                    submissionsByCategory: formattedCategoryCounts
                }
            });

        } catch (error) {
            console.error('Error fetching stats summary:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve statistics summary.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.' // More generic for production
            });
        }
    }
};

module.exports = statsController;
