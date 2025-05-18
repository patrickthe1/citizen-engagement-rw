/**
 * Controller for handling citizen submissions.
 * Includes creating new submissions and retrieving submission details by ticket ID.
 */

const { Submission, Category, Agency } = require('../models');
const { generateTicketId } = require('../utils/helpers');
const { categorizeSubmission, validateSubmission, getCategoryAndAgencyDetails } = require('../utils/categorizationAndValidation');

// Controller for submission-related endpoints
const submissionController = {
    // POST /api/submissions - Create a new submission
    createSubmission: async (req, res) => {
        try {
            // 1. Validate input using Joi schema from categorizationAndValidation.js
            const { error, value } = validateSubmission(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: error.details.map(d => d.message)
                });
            }

            const { subject, description, citizen_contact, language_preference } = value;

            // 2. Implement Simple AI Categorization (via categorizeSubmission utility)
            // This is a basic keyword matching approach suitable for an MVP.
            // It identifies a category name based on keywords in the description.
            // Limitations:
            // - Relies on a predefined keyword list in categorization_keywords.json.
            // - May not be accurate for nuanced descriptions or complex language.
            // - Does not understand context beyond keyword presence; scoring is simplistic.
            // - For a production system, a more robust NLP solution (e.g., using machine learning models) would be significantly better.
            const determinedCategoryName = categorizeSubmission(description, language_preference);
            let category_id = null;
            let agency_id = null;
            let categoryDetails = null;

            if (determinedCategoryName) {
                categoryDetails = await getCategoryAndAgencyDetails(determinedCategoryName);
                if (categoryDetails) {
                    category_id = categoryDetails.category_id;
                    agency_id = categoryDetails.agency_id;
                }
            }

            // If no category is matched or details not found, assign to a default category/agency.
            // For MVP, we'll try to find a 'General' category or leave it null if not set up.
            // This requires 'General' category and its agency to be in the DB.
            if (!category_id) {
                const defaultCategoryDetails = await getCategoryAndAgencyDetails('General'); // Assuming 'General' category exists
                if (defaultCategoryDetails) {
                    category_id = defaultCategoryDetails.category_id;
                    agency_id = defaultCategoryDetails.agency_id;
                    console.log("Submission assigned to default 'General' category.");
                } else {
                    console.warn("Default 'General' category not found. Submission will have no category/agency.");
                    // Depending on requirements, you might return an error or proceed without category/agency
                }
            }

            // 3. Generate unique ticket_id
            let ticket_id;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 5; // Prevent infinite loop in unlikely scenario of constant collisions

            do {
                ticket_id = await generateTicketId(); // Added await here
                const existingSubmission = await Submission.findOne({ where: { ticket_id } });
                if (!existingSubmission) {
                    isUnique = true;
                }
                attempts++;
            } while (!isUnique && attempts < maxAttempts);

            if (!isUnique) {
                // This is highly unlikely with a good ticket ID generation strategy
                console.error('Failed to generate a unique ticket ID after multiple attempts.');
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate a unique ticket ID. Please try again.'
                });
            }

            // 4. Set status
            const status = 'Received';

            // 5. Save submission to DB
            const newSubmission = await Submission.create({
                subject,
                description,
                citizen_contact,
                category_id, 
                agency_id,  
                ticket_id,
                status,
                submission_date: new Date(),
                language_preference // Ensure language_preference from validated input is passed
            });

            // 6. Return success response with the generated ticket ID
            return res.status(201).json({
                success: true,
                message: 'Submission received successfully.',
                data: { ticketId: newSubmission.ticket_id } // Consistent data wrapper
            });

        } catch (dbError) {
            console.error('Error creating submission:', dbError);
            // Check for specific Sequelize errors if needed, e.g., validation errors from model
            if (dbError.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Database Validation Error',
                    errors: dbError.errors.map(e => e.message)
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error while creating submission.',
                error: process.env.NODE_ENV === 'development' ? dbError.message : 'An unexpected error occurred.' // More generic for production
            });
        }
    },

    // GET /api/submissions/:ticketId - Get a submission by ticket ID
    getSubmissionByTicketId: async (req, res) => {
        try {
            const { ticketId } = req.params;

            if (!ticketId || typeof ticketId !== 'string' || ticketId.trim() === '') { // Added more robust check
                return res.status(400).json({
                    success: false,
                    message: 'Valid Ticket ID is required.'
                });
            }

            const submission = await Submission.findOne({
                where: { ticket_id: ticketId },
                include: [
                    {
                        model: Category,
                        as: 'category', // Ensure 'as' alias matches your model definition
                        attributes: ['id', 'name', 'description']
                    },
                    {
                        model: Agency,
                        as: 'agency', // Ensure 'as' alias matches your model definition
                        attributes: ['id', 'name', 'contact_information']
                    }
                ]
            });

            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found.'
                });
            }

            return res.status(200).json({
                success: true,
                data: submission // Consistent data wrapper
            });

        } catch (error) {
            console.error('Error fetching submission by ticket ID:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error while fetching submission.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.' // More generic for production
            });
        }
    }
};

module.exports = submissionController;
