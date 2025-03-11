const pool = require("../config/db-connection");
const helpers = require("../utils/helpers");


// Middleware for permission checking
function checkAccessMiddleware(permissionId) {
    return async (req, res, next) => {
        try {
            const hasPermission = await helpers.hasAccess(req, permissionId);
            if (!hasPermission) {
                return res.status(403).send('Access Denied'); // ✅ Use 403 Forbidden instead of 200
            }
            next(); // ✅ Only send response ONCE
        } catch (error) {
            console.error('Error checking access:', error);
            return res.status(500).send('Internal Server Error'); // ✅ Use 500 for internal errors
        }
    };
}



module.exports = checkAccessMiddleware;  