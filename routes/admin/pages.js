// routes/api.js
const express = require('express');
const PagesController = require('../../controllers/admin/pages');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');

const upload = require('../../file-upload');

const router = express.Router();
const pagesController = new PagesController();

router.get('/pages', ensureAuthenticated, pagesController.manage_pages.bind(pagesController));
router.get('/pages/home', ensureAuthenticated, pagesController.homeView.bind(pagesController));
router.post('/pages/home-form', ensureAuthenticated, upload, pagesController.homeForm.bind(pagesController));
router.get('/pages/about', ensureAuthenticated, pagesController.aboutView.bind(pagesController));
router.post('/pages/about-form', ensureAuthenticated, upload, pagesController.aboutForm.bind(pagesController));
router.get('/pages/contact', ensureAuthenticated, pagesController.contactView.bind(pagesController));
router.post('/pages/contact-form', ensureAuthenticated, upload, pagesController.contactForm.bind(pagesController));
router.get('/pages/privacy-policy', ensureAuthenticated, pagesController.privacyPolicyView.bind(pagesController));
router.post('/pages/privacy-policy-form', ensureAuthenticated, upload, pagesController.privacyPolicyForm.bind(pagesController));
router.get('/pages/terms-conditions', ensureAuthenticated, pagesController.termsConditionsView.bind(pagesController));
router.post('/pages/terms-conditions-form', ensureAuthenticated, upload, pagesController.termsConditionsForm.bind(pagesController));
router.get('/pages/help-support', ensureAuthenticated, pagesController.helpSupportView.bind(pagesController));
router.post('/pages/help-support-form', ensureAuthenticated, upload, pagesController.helpSupportForm.bind(pagesController));
router.get('/pages/faq', ensureAuthenticated, pagesController.faqView.bind(pagesController));
router.post('/pages/faq-form', ensureAuthenticated, upload, pagesController.faqForm.bind(pagesController));
router.get('/pages/login', ensureAuthenticated, pagesController.loginView.bind(pagesController));
router.post('/pages/login-form', ensureAuthenticated, upload, pagesController.loginForm.bind(pagesController));
router.get('/pages/forgot-password', ensureAuthenticated, pagesController.forgotPasswordView.bind(pagesController));
router.post('/pages/forgot-password-form', ensureAuthenticated, upload, pagesController.forgotPasswordForm.bind(pagesController));
router.get('/pages/sign-up', ensureAuthenticated, pagesController.signUpView.bind(pagesController));
router.post('/pages/sign-up-form', ensureAuthenticated, upload, pagesController.signUpForm.bind(pagesController));
router.get('/pages/reset-password', ensureAuthenticated, pagesController.resetPasswordView.bind(pagesController));
router.post('/pages/reset-password-form', ensureAuthenticated, upload, pagesController.resetPasswordForm.bind(pagesController));
router.get('/pages/business', ensureAuthenticated, pagesController.businessView.bind(pagesController));
router.post('/pages/business-form', ensureAuthenticated, upload, pagesController.businessForm.bind(pagesController));
router.get('/pages/rider', ensureAuthenticated, pagesController.riderView.bind(pagesController));
router.post('/pages/rider-form', ensureAuthenticated, upload, pagesController.riderForm.bind(pagesController));












module.exports = router;
