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
router.get('/terms-condition', (req, res) => pagesController.getTermsConditionsData(req, res));
router.get('/help-support', (req, res) => pagesController.getHelpSupportData(req, res));
router.get('/faq', (req, res) => pagesController.getFaqData(req, res));
router.get('/login-page', (req, res) => pagesController.getLoginData(req, res));
router.get('/forget-password', (req, res) => pagesController.getForgotPasswordData(req, res));
router.get('/signup', (req, res) => pagesController.getSignUpData(req, res));
router.get('/reset-password', (req, res) => pagesController.getResetPasswordData(req, res));
router.get('/business', (req, res) => pagesController.getBusinessData(req, res));
router.get('/rider', (req, res) => pagesController.getRiderData(req, res));
router.post('/sign-up', upload, (req, res) => pagesController.signUp(req, res));
router.post('/log-in', upload, (req, res) => pagesController.loginUser(req, res));
router.post('/email-verification', (req, res) => pagesController.verifyEmail(req, res));
router.post('/member-settings', upload, (req, res) => pagesController.getMemberFromToken(req, res));
router.post('/request-quote', upload,(req, res) => pagesController.requestQuote(req, res));
router.post('/get-addresses', upload, (req, res) => pagesController.getAddress(req, res));
router.post('/create-payment-intent', upload, (req, res) => pagesController.paymentIntent(req, res));
router.post('/save-request-quote', upload, (req, res) => pagesController.createRequestQuote(req, res));
router.post('/update-profile', upload, (req, res) => pagesController.updateProfile(req, res));
router.post('/update-password', upload, (req, res) => pagesController.changePassword(req, res));

const upload_file = multer({ 
    dest: 'uploads/', 
    limits: { fileSize: 5 * 1024 * 1024 }  // Set file size limit to 5MB
  }).single('mem_image');
  
  router.post('/upload-profile-pic', (req, res, next) => {
    upload_file(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ status: 0, msg: 'File upload error', error: err.message });
      } else if (err) {
        return res.status(500).json({ status: 0, msg: 'Server error', error: err.message });
      }
      // Continue with your logic if no error
      pagesController.uploadProfileImage(req, res);
    });
  });
  

module.exports = router;
