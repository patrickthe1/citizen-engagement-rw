const { Submission, Category, Agency } = require('../models');
const { generateTicketId } = require('../utils/helpers');

// Controller for submission-related endpoints
const submissionController = {    // POST /api/submissions - Create a new submission
    createSubmission: async (req, res) => {
        try {
            // TODO: Implement input validation
            const { category_id, subject, description, citizen_contact } = req.body;
            
            // Implementation of categorization and routing logic
            // Look up the agency_id based on the category_id
            const category = await Category.findByPk(category_id, {
                include: [{ model: Agency, attributes: ['id', 'name'] }]
            });
            const agency_id = category && category.Agency ? category.Agency.id : null;
            
            // Generate a unique ticket ID (helper function to be implemented)
            const ticket_id = await generateTicketId();
            
            // Create submission in database
            // TODO: Save submission to DB using ORM
            const submission = await Submission.create({
                ticket_id,
                category_id,
                agency_id,
                subject,
                description,
                citizen_contact,
                status: 'Received'
            });
            
            // Return success response with ticket ID
            return res.status(201).json({
                success: true,
                message: 'Submission created successfully',
                ticket_id: submission.ticket_id
            });
        } catch (error) {
            // TODO: Implement error handling
            console.error('Error creating submission:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create submission',
                error: error.message
            });
        }
    },
    
    // GET /api/submissions/:ticketId - Get a submission by ticket ID
    getSubmissionByTicketId: async (req, res) => {
        try {
            const { ticketId } = req.params;
            
            // TODO: Validate ticketId format
            
            // TODO: Retrieve submission from DB using ORM
            const submission = await Submission.findOne({
                where: { ticket_id: ticketId },
                include: [
                    { model: Category, attributes: ['name'] },
                    { model: Agency, attributes: ['name'] }
                ]
            });
            
            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found'
                });
            }
            
            // Return submission data with status info
            return res.status(200).json({
                success: true,
                submission: {
                    ticket_id: submission.ticket_id,
                    subject: submission.subject,
                    description: submission.description,
                    status: submission.status,
                    category: submission.Category ? submission.Category.name : null,
                    agency: submission.Agency ? submission.Agency.name : null,
                    created_at: submission.created_at,
                    admin_response: submission.admin_response,
                }
            });
        } catch (error) {
            // TODO: Implement error handling
            console.error('Error retrieving submission:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve submission',
                error: error.message
            });
        }
    }
};

module.exports = submissionController;
