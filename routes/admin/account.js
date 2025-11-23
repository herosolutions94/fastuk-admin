const express = require('express');
const accountController = require('../../controllers/admin/account');
const ReportsController = require('../../controllers/admin/reports');
const helpers = require("../../utils/helpers");

const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const router = express.Router();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');




router.get('/dashboard', ensureAuthenticated,checkAccessMiddleware(1), accountController.indexView);
router.get('/dashboard', ensureAuthenticated,checkAccessMiddleware(1), accountController.indexView);
// router.get('/site-settings', accountController.siteSettingsView);

const upload = require('../../file-upload');



router.get('/completed-reports', ensureAuthenticated, checkAccessMiddleware(22), ReportsController.completedReportsView);
router.get('/inprogress-reports', ensureAuthenticated, checkAccessMiddleware(22), ReportsController.inprogressReportsView);
router.post('/filter-completed-reports', ensureAuthenticated, checkAccessMiddleware(22),upload, ReportsController.filterCompletedReportsView);

router.get('/home', accountController.homeView);
router.get('/message', accountController.messageView);
router.get('/message-detail', accountController.messageDetailView);
router.get('/contact-list', accountController.contactListView);
router.get('/blog', accountController.blogView);
router.get('/analytics', accountController.analyticsView);
router.get('/form', accountController.formView);
router.get('/image-uploading', accountController.imageUploadingView);
router.get('/invoice', accountController.invoiceView);
router.get('/manage-pages', accountController.managePagesView);
router.get('/testimonials', accountController.testimonialsView);
router.get('/change-password-form', accountController.changePasswordView);

// Route to update all cities with latitude and longitude
router.get('/update-cities', async (req, res) => {
  try {
    await helpers.updateCities();
    res.send('All cities updated successfully!');
  } catch (error) {
    console.error("Error updating cities:", error.message);
    res.status(500).send('Failed to update cities');
  }
});



module.exports = router;