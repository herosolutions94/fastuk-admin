const pool  = require("../../config/db-connection");


const indexView = async (req, res, next) => {
    try {
        // Execute queries to fetch counts
        const [ridersCountResult] = await pool.query('SELECT COUNT(*) AS count FROM riders');
        const [membersCountResult] = await pool.query('SELECT COUNT(*) AS count FROM members');
        const [messagesCountResult] = await pool.query('SELECT COUNT(*) AS count FROM messages');
        const [completedOrdersCountResult] = await pool.query(
            'SELECT COUNT(*) AS count FROM request_quote WHERE status = ?',
            ['completed'] // Use parameterized query to prevent SQL injection
        );

        // Extract counts
        const ridersCount = ridersCountResult[0].count;
        const membersCount = membersCountResult[0].count;
        const messagesCount = messagesCountResult[0].count;
        const completedOrdersCount = completedOrdersCountResult[0].count;

        // Render the admin dashboard with counts
        res.render('admin/dashboard', {
            layout: 'admin/layout',
            stats: {
                riders: ridersCount,
                members: membersCount,
                messages: messagesCount,
                completedOrders: completedOrdersCount
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        next(error); // Pass the error to the error-handling middleware
    }
};


// const siteSettingsView = (req, res, next) => {
//     res.render('admin/site-settings', { layout: 'admin/layout' });
// };

const homeView = (req, res, next) => {
    res.render('admin/home', { layout: 'admin/layout' });
};

const messageView = (req, res, next) => {
    res.render('admin/message', { layout: 'admin/layout' });
};

const messageDetailView = (req, res, next) => {
    res.render('admin/message-detail', { layout: 'admin/layout' });
};

const contactListView = (req, res, next) => {
    res.render('admin/contact-list', { layout: 'admin/layout' });
};

const blogView = (req, res, next) => {
    res.render('admin/blog', { layout: 'admin/layout' });
};

const analyticsView = (req, res, next) => {
    res.render('admin/analytics', { layout: 'admin/layout' });
};

const formView = (req, res, next) => {
    res.render('admin/form', { layout: 'admin/layout' });
};

const imageUploadingView = (req, res, next) => {
    res.render('admin/image-uploading', { layout: 'admin/layout' });
};

const invoiceView = (req, res, next) => {
    res.render('admin/invoice', { layout: 'admin/layout' });
};

const managePagesView = (req, res, next) => {
    res.render('admin/manage-pages', { layout: 'admin/layout' });
};

const testimonialsView = (req, res, next) => {
    res.render('admin/testimonials', { layout: 'admin/layout' });
};

const changePasswordView = (req, res, next) => {
    res.render('admin/change-password', { layout: 'admin/layout' });
};






module.exports = {

    indexView,
    // siteSettingsView,
    homeView,
    messageView,
    messageDetailView,
    contactListView,
    blogView,
    analyticsView,
    formView,
    imageUploadingView,
    invoiceView,
    managePagesView,
    testimonialsView,
    changePasswordView


};