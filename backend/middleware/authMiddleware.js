const jwt = require('jsonwebtoken');

const ensureAdminAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No token provided.'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_FALLBACK_SECRET_KEY');
            
            // Check if the decoded token contains the user and role information
            if (decoded && decoded.role === 'admin') {
                req.user = decoded; // Make user info from token available in req.user
                return next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Access is restricted to administrators. Invalid token role.'
                });
            }
        } catch (error) {
            // Token verification failed (e.g., expired, malformed, invalid signature)
            console.error('Token verification error:', error.message);
            return res.status(401).json({
                success: false,
                message: `Unauthorized: ${error.message}`
            });
        }
    } else {
        // No Authorization header with Bearer token found
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Authorization header with Bearer token is missing.'
        });
    }
};

module.exports = { ensureAdminAuthenticated };
