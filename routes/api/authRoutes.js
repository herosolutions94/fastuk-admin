// routes/api.js
const express = require('express');
const multer = require('multer');
const upload = require('../../file-upload');
const router = express.Router();



const AuthController = require('../../controllers/api/authController');
const RiderController = require('../../controllers/api/riderController');

const riderController = new RiderController();


const authController = new AuthController();

router.post('/sign-up', upload, (req, res) => authController.signUp(req, res));
router.post('/log-in', upload, (req, res) => authController.loginUser(req, res));
router.post('/email-verification', (req, res) => authController.verifyEmail(req, res));

router.post('/verify-otp', upload, authController.verifyEmail.bind(authController));
router.post('/resend-email', upload, authController.ResendOtp.bind(authController));
router.post('/deactivate-account', upload, authController.deactivateAccount.bind(authController));
router.post('/request-password-reset', authController.requestPasswordReset.bind(authController));


router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/forgot-password', upload,authController.forgetPassword.bind(authController));
router.post('/verify-request-forget-otp', upload,authController.verifyOtpAndGenerateToken.bind(authController));
router.post('/reset-password-request', upload,authController.resetPassword.bind(authController));
router.post('/update-email-address', upload,authController.UpdateEmailAddress.bind(authController));



module.exports = router;

