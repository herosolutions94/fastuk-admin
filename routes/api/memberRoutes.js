// routes/api.js
const express = require('express');
const MemberController = require('../../controllers/api/memberController');
const upload = require('../../file-upload');
const multer = require('multer');

const router = express.Router();
const memberController = new MemberController();

// Route to register a rider

router.post('/get-addresses', upload, memberController.getAddresses.bind(memberController));
router.post('/add-addresses', upload,memberController.getAndInsertAddress.bind(memberController));
router.post('/update-addresses', upload,memberController.updateAddress.bind(memberController));
router.post('/delete-addresses', upload,memberController.deleteAddress.bind(memberController));
router.post('/set-as-default-addresses', upload,memberController.setAsDefaultAddress.bind(memberController));
router.post('/request-quote', upload,(req, res) => memberController.requestQuote(req, res));
router.post('/member-settings', upload, (req, res) => memberController.getMemberFromToken(req, res));

router.post('/create-payment-intent', upload, (req, res) => memberController.paymentIntent(req, res));
router.post('/save-request-quote', upload, (req, res) => memberController.createRequestQuote(req, res));
router.post('/update-profile', upload, (req, res) => memberController.updateProfile(req, res));
router.post('/update-password', upload, (req, res) => memberController.changePassword(req, res));
router.post('/get-user-orders', upload, (req, res) => memberController.getUserOrders(req, res));
router.post('/get-user-order-details/:encodedId', upload, (req, res) => memberController.getUserOrderDetailsByEncodedId(req, res));
router.post('/user-payment-method', upload, (req, res) => memberController.userPaymentMethod(req, res));
router.post('/add-payment-method', upload, (req, res) => memberController.addPaymentMethod(req, res));
router.post('/delete-payment-method', upload, (req, res) => memberController.deletePaymentMethod(req, res));
router.post('/mark-payment-method-as-default', upload, (req, res) => memberController.markPaymentMethodAsDefault(req, res));
router.post('/get-user-notifications', upload, (req, res) => memberController.getNotifications(req, res));




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
      memberController.uploadProfileImage(req, res);
    });
  });

module.exports = router;
