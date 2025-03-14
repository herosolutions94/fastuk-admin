const helpers = require("../utils/helpers");

module.exports = async (req, res, next) => {
    res.locals.req = req;
    res.locals.admin = req.session.admin || null;
    res.locals.sidebarPermissions = {};

    if (req.session.admin && req.session.admin.type === 'admin') {
        // ✅ Admin gets all permissions
        res.locals.sidebarPermissions = Object.fromEntries(
            Array.from({ length: 20 }, (_, i) => [i + 1, true])
        );
    } else if (req.session.permissions) {
        // ✅ Sub-admin gets specific permissions
        req.session.permissions.forEach(id => {
            res.locals.sidebarPermissions[id] = true;
        });
        // console.log("Final Sidebar Permissions:", res.locals.sidebarPermissions);

    }

    // console.log("Final Sidebar Permissions:", res.locals.sidebarPermissions);
    // console.log("Session Permissions:", req.session.permissions);

    // console.log("Admin Type:", req.session.admin ? req.session.admin.type : "No Admin");

    next();
};
