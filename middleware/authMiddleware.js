// middlewares/authMiddleware.js
module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.session && req.session.admin) { // Assuming you're using sessions to track login
            return next(); // User is authenticated, proceed to the next middleware/route
        } else {
            return res.redirect('/admin/login'); // If not authenticated, redirect to the login page
        }
    },
    redirectIfAuthenticated: (req, res, next) => {
        if (req.session && req.session.admin) {
            return res.redirect('/admin/dashboard'); // If already logged in, redirect to the dashboard
        } else {
            return next(); // Proceed to login if not authenticated
        }
    }
};
