// routes/api.js
const express = require('express');
const PagesController = require('../../controllers/admin/pages');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');

const upload = require('../../file-upload');

const router = express.Router();
const pagesController = new PagesController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/pages', ensureAuthenticated, checkAccessMiddleware(10), pagesController.manage_pages.bind(pagesController));
router.get('/pages/home', ensureAuthenticated, checkAccessMiddleware(10), pagesController.homeView.bind(pagesController));
router.post('/pages/home-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.homeForm.bind(pagesController));
router.get('/pages/home2', ensureAuthenticated, checkAccessMiddleware(10), pagesController.home2View.bind(pagesController));
router.post('/pages/home2-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.home2Form.bind(pagesController));
router.get('/pages/about', ensureAuthenticated, checkAccessMiddleware(10), pagesController.aboutView.bind(pagesController));
router.post('/pages/about-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.aboutForm.bind(pagesController));
router.get('/pages/contact', ensureAuthenticated, checkAccessMiddleware(10), pagesController.contactView.bind(pagesController));
router.post('/pages/contact-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.contactForm.bind(pagesController));
router.get('/pages/privacy-policy', ensureAuthenticated, checkAccessMiddleware(10), pagesController.privacyPolicyView.bind(pagesController));
router.post('/pages/privacy-policy-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.privacyPolicyForm.bind(pagesController));
router.get('/pages/refund-policy', ensureAuthenticated, checkAccessMiddleware(10), pagesController.refundPolicyView.bind(pagesController));
router.post('/pages/refund-policy-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.refundPolicyForm.bind(pagesController));
router.get('/pages/terms-conditions', ensureAuthenticated, checkAccessMiddleware(10), pagesController.termsConditionsView.bind(pagesController));
router.post('/pages/terms-conditions-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.termsConditionsForm.bind(pagesController));
router.get('/pages/charge-aggreement', ensureAuthenticated, checkAccessMiddleware(10), pagesController.chargeAggreementView.bind(pagesController));
router.post('/pages/charge-aggreement-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.chargeAggreementForm.bind(pagesController));
router.get('/pages/help-support', ensureAuthenticated, checkAccessMiddleware(10), pagesController.helpSupportView.bind(pagesController));
router.post('/pages/help-support-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.helpSupportForm.bind(pagesController));
router.get('/pages/faq', ensureAuthenticated,checkAccessMiddleware(10), pagesController.faqView.bind(pagesController));
router.post('/pages/faq-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.faqForm.bind(pagesController));
router.get('/pages/login', ensureAuthenticated, checkAccessMiddleware(10), pagesController.loginView.bind(pagesController));
router.post('/pages/login-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.loginForm.bind(pagesController));
router.get('/pages/forgot-password', ensureAuthenticated, checkAccessMiddleware(10), pagesController.forgotPasswordView.bind(pagesController));
router.post('/pages/forgot-password-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.forgotPasswordForm.bind(pagesController));
router.get('/pages/sign-up', ensureAuthenticated, checkAccessMiddleware(10), pagesController.signUpView.bind(pagesController));
router.post('/pages/sign-up-form', ensureAuthenticated, checkAccessMiddleware(10), upload, pagesController.signUpForm.bind(pagesController));
router.get('/pages/rider-signup', ensureAuthenticated, checkAccessMiddleware(10),pagesController.riderSignUpView.bind(pagesController));
router.post('/pages/rider-signup-form', ensureAuthenticated,checkAccessMiddleware(10), upload, pagesController.riderSignUpForm.bind(pagesController));
router.get('/pages/reset-password', ensureAuthenticated,checkAccessMiddleware(10), pagesController.resetPasswordView.bind(pagesController));
router.post('/pages/reset-password-form', ensureAuthenticated,checkAccessMiddleware(10), upload, pagesController.resetPasswordForm.bind(pagesController));
router.get('/pages/business', ensureAuthenticated,checkAccessMiddleware(10), pagesController.businessView.bind(pagesController));
router.post('/pages/business-form', ensureAuthenticated,checkAccessMiddleware(10), upload, pagesController.businessForm.bind(pagesController));
router.get('/pages/rider', ensureAuthenticated,checkAccessMiddleware(10), pagesController.riderView.bind(pagesController));
router.post('/pages/rider-form', ensureAuthenticated,checkAccessMiddleware(10), upload, pagesController.riderForm.bind(pagesController));












module.exports = router;
