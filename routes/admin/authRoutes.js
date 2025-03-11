// routes/api.js
const express = require('express');
const authController = require('../../controllers/admin/authController');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');
const upload = require('../../file-upload');

const router = express.Router();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');



router.get('/login', redirectIfAuthenticated, authController.renderLoginPage.bind(authController));
router.post('/loginAuth', upload, authController.login.bind(authController));
router.post('/update-settings',checkAccessMiddleware(19),ensureAuthenticated, upload, authController.updateSiteSettings.bind(authController));
router.get('/site-settings', ensureAuthenticated,checkAccessMiddleware(19), authController.getSiteSettings.bind(authController));

router.post('/change-password', ensureAuthenticated, authController.changePassword.bind(authController));
router.get('/logout', ensureAuthenticated, authController.logout.bind(authController));






module.exports = router;
