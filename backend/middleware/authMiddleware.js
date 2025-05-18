const ensureAdminAuthenticated = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        // User is authenticated and is an admin, proceed to the next middleware or route handler
        req.user = req.session.user; // Make user info available in req.user
        return next();
    }
    // User is not authenticated or not an admin
    return res.status(403).json({
        success: false,
        message: 'Forbidden: Access is restricted to administrators.'
    });
};

module.exports = { ensureAdminAuthenticated };
