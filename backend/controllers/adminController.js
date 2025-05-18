/**
 * Controller for admin-specific functionalities.
 * Includes admin login, retrieving submissions for an admin's agency,
 * and updating submission status and responses.
 */

const { User, Submission, Agency, Category } = require('../models');
const Joi = require('joi'); // For status validation
const bcrypt = require('bcrypt'); // For password hashing
const saltRounds = 10; // For bcrypt

// Allowed submission statuses
const ALLOWED_STATUSES = ['Received', 'In Progress', 'Resolved', 'Closed'];

// Validation schema for submission status update
const updateSubmissionStatusSchema = Joi.object({
    status: Joi.string().valid(...ALLOWED_STATUSES).required(),
    admin_response: Joi.string().allow('', null).max(5000) // Optional, can be empty or null
});

// Controller for admin-related endpoints
const adminController = {
    // POST /api/admin/login - Admin login
    login: async (req, res) => {
        console.log('Login attempt received.');
        console.log('Request Content-Type Header:', req.headers['content-type']);
        console.log('Raw Request Body:', req.body); // Log the body as received by express.json()

        try {
            // Explicitly check if req.body is populated and is an object
            if (!req.body || typeof req.body !== 'object' || req.body === null) {
                console.error('Login failed: req.body is missing, not an object, or null. Ensure Content-Type is application/json and body is valid JSON.');
                return res.status(400).json({
                    success: false,
                    message: 'Login failed: Request body is missing, not an object, or not in JSON format. Please ensure Content-Type is set to application/json and the body is valid JSON.',
                });
            }

            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required.'
                });
            }

            const user = await User.findOne({ 
                where: { username },
                include: [
                    { model: Agency, as: 'agency', attributes: ['id', 'name'] }
                ]
            });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // --- MVP AUTHENTICATION --- 
            // IMPORTANT: This is a simplified password check for MVP purposes only.
            // It directly compares the provided password with the stored hash after bcrypt comparison.
            // FOR PRODUCTION: Implement proper, secure authentication (e.g., JWT, OAuth, more robust session management).
            // The current session management is basic and relies on express-session's default memory store (not suitable for production scaling).
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Store user information in session
            req.session.user = {
                id: user.id,
                username: user.username,
                agency_id: user.agency_id,
                role: user.role
            };
            
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: { // Consistent data wrapper for user info
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    agency: user.agency ? {
                        id: user.agency.id,
                        name: user.agency.name
                    } : null
                }
            });
        } catch (error) {
            console.error('Error during login:', error);
            // Check if the error is the specific destructuring error due to req.body being undefined or null
            if (error instanceof TypeError && error.message.toLowerCase().includes("cannot destructure property") && (error.message.toLowerCase().includes("of undefined") || error.message.toLowerCase().includes("of null"))) {
                 return res.status(400).json({
                    success: false,
                    message: 'Login failed: Malformed request. Ensure Content-Type is application/json and the request body is correctly formatted.',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Bad Request. Please check your input.' // More generic for production
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Login failed due to an internal error.', // Slightly more specific message
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
            });
        }
    },
    
    // GET /api/admin/submissions - Get submissions for the admin's agency
    getAllSubmissions: async (req, res) => {
        // REMOVE TEMPORARY FOR TESTING 
        // // Simulate a RURA admin being logged in
        // req.user = { agency_id: 2 }; // Assuming RURA's agency_id is 2. Adjust as per your seed_data.sql
        // END TEMPORARY
        
        // req.user should be populated by auth middleware
        if (!req.user || req.user.agency_id === undefined) {
            console.error('Auth Error: req.user or req.user.agency_id not available.');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Admin agency information not available.'
            });
        }

        const adminAgencyId = req.user.agency_id;

        try {
            const submissions = await Submission.findAll({
                where: { agency_id: adminAgencyId }, // Filter by admin's agency_id
                include: [
                    {
                        model: Category,
                        as: 'category', // Ensure alias matches model association
                        attributes: ['id', 'name']
                    },
                    {
                        model: Agency,
                        as: 'agency', // Ensure alias matches model association
                        attributes: ['id', 'name']
                    }
                ],
                order: [['created_at', 'DESC']]
            });
            
            return res.status(200).json({
                success: true,
                data: submissions // Consistent data wrapper
            });
        } catch (error) {
            console.error('Error retrieving submissions for admin:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve submissions.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
            });
        }
    },
    
    // PUT /api/admin/submissions/:id - Update submission status and admin response
    updateSubmission: async (req, res) => {
        // REMOVE TEMPORARY FOR TESTING
        // // Simulate a RURA admin being logged in
        // req.user = { agency_id: 2 }; // Assuming RURA's agency_id is 2. Adjust as per your seed_data.sql
        // END TEMPORARY

        // req.user should be populated by auth middleware
        if (!req.user || req.user.agency_id === undefined) {
            console.error('Auth Error: req.user or req.user.agency_id not available.');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Admin information not available.'
            });
        }

        const adminAgencyId = req.user.agency_id;
        const { id } = req.params;

        // Validate ID parameter
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Submission ID provided.'
            });
        }

        try {
            // Validate input body
            const { error, value } = updateSubmissionStatusSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: error.details.map(d => d.message)
                });
            }
            const { status, admin_response } = value;
            
            const submission = await Submission.findByPk(id);
            
            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found'
                });
            }

            // Agency Access Check: Ensure admin can only update submissions for their own agency
            if (submission.agency_id !== adminAgencyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You are not authorized to update this submission.'
                });
            }
            
            // Update the fields
            submission.status = status;
            submission.admin_response = admin_response !== undefined ? admin_response : submission.admin_response; // Keep old if not provided
            // submission.updated_at will be handled by Sequelize automatically if timestamps: true
            
            await submission.save();
            
            // Refetch to include associations in the response, or selectively build the response object
            const updatedSubmissionWithDetails = await Submission.findOne({
                where: { id: submission.id },
                include: [
                    { model: Category, as: 'category', attributes: ['id', 'name'] },
                    { model: Agency, as: 'agency', attributes: ['id', 'name'] }
                ]
            });

            return res.status(200).json({
                success: true,
                message: 'Submission updated successfully',
                data: updatedSubmissionWithDetails // Consistent data wrapper
            });
        } catch (error) {
            console.error('Error updating submission:', error);
            // Handle potential Sequelize validation errors from model, if any
            if (error.name === 'SequelizeValidationError') {
                 return res.status(400).json({
                    success: false,
                    message: 'Database Validation Error',
                    errors: error.errors.map(e => e.message) // Keep detailed Joi errors
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Failed to update submission.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
            });
        }
    }
};

module.exports = adminController;
