// routes/home.js
const express = require('express');
const router = express.Router();
const PagesController = require('../../controllers/api/pages');
const upload = require('../../file-upload');
const multer = require('multer');

const pagesController = new PagesController();


router.get('/home', (req, res) => pagesController.getHomeData(req, res));
router.get('/about', (req, res) => pagesController.getAboutData(req, res));
router.get('/contact', (req, res) => pagesController.getContactData(req, res));
router.get('/privacy-policy', (req, res) => pagesController.getPrivacyPolicyData(req, res));
router.get('/refund-policy', (req, res) => pagesController.getRefundPolicyData(req, res));
router.get('/terms-condition', (req, res) => pagesController.getTermsConditionsData(req, res));
router.get('/charge-aggreement', (req, res) => pagesController.getChargeAggreementData(req, res));
router.get('/help-support', (req, res) => pagesController.getHelpSupportData(req, res));
router.get('/faq', (req, res) => pagesController.getFaqData(req, res));
router.get('/login-page', (req, res) => pagesController.getLoginData(req, res));
router.get('/forget-password', (req, res) => pagesController.getForgotPasswordData(req, res));
router.get('/signup', (req, res) => pagesController.getSignUpData(req, res));
router.get('/rider-signup', (req, res) => pagesController.getRiderSignUpData(req, res));
router.post('/rider-profile',upload, (req, res) => pagesController.getRiderProfileData(req, res));
router.get('/reset-password', (req, res) => pagesController.getResetPasswordData(req, res));
router.get('/business', (req, res) => pagesController.getBusinessData(req, res));
router.get('/rider', (req, res) => pagesController.getRiderData(req, res));

router.post('/get-addresses', upload, (req, res) => pagesController.getAddress(req, res));
router.post('/save-subscriber', upload, (req, res) => pagesController.save_subscriber(req, res));
router.post('/save-contact-message', upload, (req, res) => pagesController.save_contact_message(req, res));
router.post('/site-settings', upload, (req, res) => pagesController.getSiteSettingsData(req, res));
router.post('/search-cities', upload, (req, res) => pagesController.searchCities(req, res));
router.post('/apply-promo', upload, (req, res) => pagesController.applyPromoCode(req, res));
router.post('/vehicles/by-category/:categoryId', upload, (req, res) => pagesController.getVehiclesByCategoryId(req, res));
router.post('/upload-license', upload, (req, res) => pagesController.uploadLicense(req, res));
router.post('/available-categories', upload, (req, res) => pagesController.getAvailableVehicleCategories(req, res));
// router.post('/orders', upload, (req, res) => pagesController.getOrders(req, res));




  

module.exports = router;
