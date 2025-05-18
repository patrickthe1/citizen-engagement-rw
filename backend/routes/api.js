const express = require('express');
const router = express.Router();

// Import controllers (will be created later)
const submissionController = require('../controllers/submissionController');
const agencyController = require('../controllers/agencyController');
const categoryController = require('../controllers/categoryController');
const adminController = require('../controllers/adminController');

// Import middleware
const { ensureAdminAuthenticated } = require('../middleware/authMiddleware');

// Citizen routes
// POST /api/submissions - Submit a new complaint
router.post('/submissions', submissionController.createSubmission);

// GET /api/submissions/:ticketId - Get submission details for tracking
router.get('/submissions/:ticketId', submissionController.getSubmissionByTicketId);

// GET /api/agencies - Get list of all agencies
router.get('/agencies', agencyController.getAllAgencies);

// GET /api/categories - Get list of all categories
router.get('/categories', categoryController.getAllCategories);

// Admin routes
// POST /api/admin/login - Admin login
router.post('/admin/login', adminController.login);

// GET /api/admin/submissions - Get all submissions (admin only, protected)
router.get('/admin/submissions', ensureAdminAuthenticated, adminController.getAllSubmissions);

// PUT /api/admin/submissions/:id - Update submission status/response (admin only, protected)
router.put('/admin/submissions/:id', ensureAdminAuthenticated, adminController.updateSubmission);

module.exports = router;
