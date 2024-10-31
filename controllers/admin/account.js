

const indexView = (req, res, next) => {
    res.render('admin/dashboard', { layout: 'admin/layout' });
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