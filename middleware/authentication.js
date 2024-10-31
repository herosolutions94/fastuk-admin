const authenticateMiddleware = (req, res, next) => {
    // console.log('Session:', req.session); // Add this line to log session information

    // Check if the request is for admin routes
    if (req.url.startsWith('/admin')) {
        // Check if user is attempting to access the login page
        if (req.url === '/admin/login') {
            // If accessing the login page, skip authentication check
            return next();
        }

        // Check if user is authenticated as admin
        if (req.session && req.session.id) {
            // Admin is authenticated, allow access to all other admin pages
            return next();
        } else {
            // If not authenticated as admin, redirect to the login page
            return res.redirect('/admin/login');
        }
    } else {
        // For non-admin routes, proceed without authentication check
        return next();
    }
};

module.exports = authenticateMiddleware;
