const { User, Submission, Agency, Category } = require('../models');
const Joi = require('joi'); // For status validation

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
        try {
            // TODO: Implement input validation
            const { username, password } = req.body;
            
            // TODO: Implement actual authentication
            // For MVP, this is a placeholder for future proper authentication
            const user = await User.findOne({ 
                where: { username },
                include: [
                    { model: Agency, as: 'agency', attributes: ['id', 'name'] } // Added as: 'agency'
                ]
            });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // TODO: Implement proper password check with hashing
            // This is just a placeholder for the MVP structure
            if (user.password_hash !== password) { // In a real app, use bcrypt.compare
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // TODO: Generate JWT token and set it in req.user for subsequent requests
            // For now, we'll simulate req.user for other admin functions based on this login.
            // This is NOT how it would work in production.
            req.user = { // SIMULATING req.user for Phase 2 testing
                id: user.id,
                username: user.username,
                agency_id: user.agency_id, // Crucial for Phase 2
                role: user.role
            };
            
            return res.status(200).json({
                success: true,
                message: 'Login successful (simulation for Phase 2)',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    agency: user.agency ? { // Changed from user.Agency to user.agency to match alias
                        id: user.agency.id,
                        name: user.agency.name
                    } : null
                }
                // token: 'jwt-token-placeholder' // To be implemented
            });
        } catch (error) {
            console.error('Error during login:', error);
            return res.status(500).json({
                success: false,
                message: 'Login failed',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    },
    
    // GET /api/admin/submissions - Get submissions for the admin's agency
    getAllSubmissions: async (req, res) => {
           // TEMPORARY FOR TESTING - REMOVE LATER
    // Simulate a RURA admin being logged in
    req.user = { agency_id: 2 }; // Assuming RURA's agency_id is 2. Adjust as per your seed_data.sql
    // END TEMPORARY
        // ASSUMPTION: req.user.agency_id is available from auth middleware
        if (!req.user || req.user.agency_id === undefined) { // Check if agency_id is undefined or null
            // This check is more for development; proper auth middleware would handle unauthorized access.
            console.error('Auth Error: req.user.agency_id not available. Ensure login simulation or actual auth is working.');
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
                data: submissions
            });
        } catch (error) {
            console.error('Error retrieving submissions for admin:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve submissions.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    },
    
    // PUT /api/admin/submissions/:id - Update submission status/response (admin only)
    updateSubmission: async (req, res) => {

           // TEMPORARY FOR TESTING - REMOVE LATER
    // Simulate a RURA admin being logged in
    req.user = { agency_id: 2 }; // Assuming RURA's agency_id is 2. Adjust as per your seed_data.sql
    // END TEMPORARY
        // ASSUMPTION: req.user.agency_id is available from auth middleware
        if (!req.user || req.user.agency_id === undefined) { // Check if agency_id is undefined or null
            console.error('Auth Error: req.user.agency_id not available. Ensure login simulation or actual auth is working.');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Admin agency information not available.'
            });
        }
        const adminAgencyId = req.user.agency_id;
        const { id } = req.params;

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
                data: updatedSubmissionWithDetails
            });
        } catch (error) {
            console.error('Error updating submission:', error);
            // Handle potential Sequelize validation errors from model, if any
            if (error.name === 'SequelizeValidationError') {
                 return res.status(400).json({
                    success: false,
                    message: 'Database Validation Error',
                    errors: error.errors.map(e => e.message)
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Failed to update submission.',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }
};

module.exports = adminController;
