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
            // IMPORTANT: Ensure submissionValidationSchema in categorizationAndValidation.js includes an optional 'category_id' field (e.g., Joi.string().guid({ version: ['uuidv4'] }).allow(null, '') or Joi.number().integer().allow(null) depending on ID type).
            const { error, value } = validateSubmission(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: error.details.map(d => d.message)
                });
            }

            // Destructure validated data, including the optional category_id from frontend
            const { subject, description, citizen_contact, language_preference, category_id: frontend_selected_category_id } = value;

            console.log('[DEBUG] Received frontend_selected_category_id:', frontend_selected_category_id); // Added for debugging

            let final_category_id = null;
            let final_agency_id = null;

            // 2. Prioritize category_id if provided by the frontend and is valid
            if (frontend_selected_category_id) {
                console.log(`[DEBUG] Frontend provided category_id: ${frontend_selected_category_id}. Attempting to use it.`);
                try {
                    const category = await Category.findByPk(frontend_selected_category_id);
                    console.log('[DEBUG] Fetched category by Pk:', category ? category.toJSON() : null); // Added for debugging

                    if (category && category.agency_id) { // Ensure category exists and has an agency_id
                        final_category_id = category.id;
                        final_agency_id = category.agency_id;
                        console.log(`[DEBUG] Successfully used frontend category_id: ${final_category_id}, and associated agency_id: ${final_agency_id}. Skipping AI categorization.`);
                    } else {
                        if (!category) {
                            console.warn(`[DEBUG] Frontend provided category_id ${frontend_selected_category_id} was not found in the database. Falling back to AI categorization.`);
                        } else { // Category found but no agency_id
                            console.warn(`[DEBUG] Category ${frontend_selected_category_id} (Name: ${category.name}) was found, but it has no associated agency_id (agency_id: ${category.agency_id}). Falling back to AI categorization / General category.`);
                        }
                        // Let it fall through to AI categorization if frontend ID is problematic
                    }
                } catch (e) {
                    console.error(`Error fetching category by frontend_selected_category_id ${frontend_selected_category_id}:`, e);
                    // Let it fall through to AI categorization
                }
            }

            // 3. Fallback to AI Categorization if not determined by frontend selection
            if (!final_category_id) { // Only run if frontend selection didn't yield a category and agency
                if (frontend_selected_category_id) { // Log if frontend tried but failed
                    console.log("Frontend category_id was provided but could not be used (e.g., not found or no agency_id). Proceeding with AI categorization as fallback.");
                } else {
                    console.log("No category_id provided by frontend. Proceeding with AI categorization.");
                }
                
                const determinedCategoryName = categorizeSubmission(description, language_preference);
                let categoryDetailsAI = null; // Use a different variable name to avoid confusion

                if (determinedCategoryName) {
                    categoryDetailsAI = await getCategoryAndAgencyDetails(determinedCategoryName);
                    if (categoryDetailsAI) {
                        final_category_id = categoryDetailsAI.category_id;
                        final_agency_id = categoryDetailsAI.agency_id;
                        console.log(`AI categorization determined Category: ${determinedCategoryName} (ID: ${final_category_id}), Agency ID: ${final_agency_id}`);
                    } else {
                        console.log(`AI categorization determined Category Name: ${determinedCategoryName}, but no details found (ID/Agency).`);
                    }
                }

                // If still no category (AI failed or no determined name), fall back to 'General'
                if (!final_category_id) {
                    console.log("AI categorization did not yield a valid category. Falling back to 'General' category.");
                    const defaultCategoryDetails = await getCategoryAndAgencyDetails('General');
                    if (defaultCategoryDetails) {
                        final_category_id = defaultCategoryDetails.category_id;
                        final_agency_id = defaultCategoryDetails.agency_id;
                        console.log(`Submission assigned to default 'General' category. Category ID: ${final_category_id}, Agency ID: ${final_agency_id}`);
                    } else {
                        console.error("CRITICAL: Default 'General' category not found or has no agency. Submission will have null category/agency. Check seed_data.sql and Category model.");
                        // For MVP, allow submission with nulls if schema permits and 'General' is misconfigured.
                    }
                }
            }

            // 4. Generate unique ticket_id
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

            // 5. Set status
            const status = 'Received';

            // 6. Save submission to DB
            const newSubmission = await Submission.create({
                subject,
                description,
                citizen_contact,
                category_id: final_category_id, 
                agency_id: final_agency_id,  
                ticket_id,
                status,
                submission_date: new Date(), // Consider using Sequelize's default `createdAt` by removing this if `timestamps: true` is set in model
                language_preference
            });

            // 7. Return success response with the generated ticket ID
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
