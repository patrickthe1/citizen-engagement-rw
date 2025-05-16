const { User, Submission, Agency, Category } = require('../models');

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
                    { model: Agency, attributes: ['id', 'name'] }
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
            if (user.password_hash !== password) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // TODO: Generate JWT token
            
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    agency: user.Agency ? {
                        id: user.Agency.id,
                        name: user.Agency.name
                    } : null
                }
                // token: 'jwt-token-placeholder' // To be implemented
            });
        } catch (error) {
            // TODO: Implement error handling
            console.error('Error during login:', error);
            return res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    },
    
    // GET /api/admin/submissions - Get all submissions (admin only)
    getAllSubmissions: async (req, res) => {
        try {
            // TODO: Implement authentication middleware
            // TODO: Implement agency filtering based on logged in user's agency
            
            // For MVP structure, getting all submissions
            // TODO: Retrieve submissions from DB using ORM with filtering
            const submissions = await Submission.findAll({
                include: [
                    { model: Category, attributes: ['name'] },
                    { model: Agency, attributes: ['name'] }
                ],
                order: [['created_at', 'DESC']]
            });
            
            return res.status(200).json({
                success: true,
                submissions: submissions.map(sub => ({
                    id: sub.id,
                    ticket_id: sub.ticket_id,
                    subject: sub.subject,
                    description: sub.description,
                    status: sub.status,
                    category: sub.Category ? sub.Category.name : null,
                    agency: sub.Agency ? sub.Agency.name : null,
                    citizen_contact: sub.citizen_contact,
                    created_at: sub.created_at,
                    updated_at: sub.updated_at,
                    admin_response: sub.admin_response
                }))
            });
        } catch (error) {
            // TODO: Implement error handling
            console.error('Error retrieving submissions:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve submissions',
                error: error.message
            });
        }
    },
    
    // PUT /api/admin/submissions/:id - Update submission status/response (admin only)
    updateSubmission: async (req, res) => {
        try {
            // TODO: Implement authentication middleware
            const { id } = req.params;
            const { status, admin_response } = req.body;
            
            // TODO: Validate input data
            // TODO: Validate that status is one of the allowed values
            
            // TODO: Retrieve and update submission in DB using ORM
            const submission = await Submission.findByPk(id);
            
            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found'
                });
            }
            
            // Update the fields
            if (status) submission.status = status;
            if (admin_response) submission.admin_response = admin_response;
            
            // Save the changes
            await submission.save();
            
            return res.status(200).json({
                success: true,
                message: 'Submission updated successfully',
                submission: {
                    id: submission.id,
                    ticket_id: submission.ticket_id,
                    status: submission.status,
                    admin_response: submission.admin_response,
                    updated_at: submission.updated_at
                }
            });
        } catch (error) {
            // TODO: Implement error handling
            console.error('Error updating submission:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update submission',
                error: error.message
            });
        }
    }
};

module.exports = adminController;
