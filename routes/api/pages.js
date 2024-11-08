// routes/home.js
const express = require('express');
const router = express.Router();
const PagesController = require('../../controllers/api/pages');
const upload = require('../../file-upload');

const pagesController = new PagesController();


router.get('/home', (req, res) => pagesController.getHomeData(req, res));
router.get('/about', (req, res) => pagesController.getAboutData(req, res));
router.get('/contact', (req, res) => pagesController.getContactData(req, res));
router.get('/privacy-policy', (req, res) => pagesController.getPrivacyPolicyData(req, res));
router.get('/terms-condition', (req, res) => pagesController.getTermsConditionsData(req, res));
router.get('/help-support', (req, res) => pagesController.getHelpSupportData(req, res));
router.get('/faq', (req, res) => pagesController.getFaqData(req, res));
router.get('/login', (req, res) => pagesController.getLoginData(req, res));
router.get('/forget-password', (req, res) => pagesController.getForgotPasswordData(req, res));
router.get('/signup', (req, res) => pagesController.getSignUpData(req, res));
router.get('/reset-password', (req, res) => pagesController.getResetPasswordData(req, res));
router.get('/business', (req, res) => pagesController.getBusinessData(req, res));
router.get('/rider', (req, res) => pagesController.getRiderData(req, res));
router.get('/multistepform', (req, res) => pagesController.multiStepForm(req, res));
router.post('/get-addresses', upload, (req, res) => pagesController.getAddress(req, res));

module.exports = router;
