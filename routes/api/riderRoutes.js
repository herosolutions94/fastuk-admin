// routes/api.js
const express = require('express');
const RiderController = require('../../controllers/api/riderController');
const upload = require('../../file-upload');
const multer = require('multer');

const router = express.Router();
const riderController = new RiderController();

// Route to register a rider
router.post('/register-riders', upload, riderController.registerRider.bind(riderController));
router.post('/login', riderController.loginRider.bind(riderController));
router.post('/verify-email', upload,riderController.verifyEmail.bind(riderController));
router.post('/rider-jobs', upload,riderController.getRequestQuotesByCity.bind(riderController));
router.post('/accept-request-quote-by-rider', upload,riderController.assignRiderToRequest.bind(riderController));
router.post('/get-rider-orders', upload, riderController.getRiderOrders.bind(riderController));
router.post('/get-order-details/:encodedId', upload,riderController.getOrderDetailsByEncodedId.bind(riderController));
router.post('/update-request-status', upload,riderController.updateRequestStatus.bind(riderController));
router.post('/mark-as-completed', upload,riderController.markAsCompleted.bind(riderController));
router.get('/get-invoices-detail', upload,riderController.getInvoiceDetails.bind(riderController));
router.post('/test-notification', upload,riderController.testNotification.bind(riderController));
router.post('/update-order-completed', upload,riderController.updateRequestStatusToCompleted.bind(riderController));
router.post('/get-rider-dashboard-orders', upload,riderController.getRiderDashboardOrders.bind(riderController));
router.post('/rider-payment-methods', upload,riderController.getRiderPaymentMethods.bind(riderController));
router.post('/add-withdrawal-method', upload,riderController.AddWithdrawalMethod.bind(riderController));
router.post('/update-withdrawal-method', upload,riderController.UpdateWithdrawalMethod.bind(riderController));
router.post('/delete-withdrawal-method', upload,riderController.DeleteWithdrawalMethod.bind(riderController));
router.post('/get-rider-earnings', upload, riderController.getRiderEarnings.bind(riderController));



const upload_file = multer({ 
    dest: 'uploads/', 
    limits: { fileSize: 5 * 1024 * 1024 }  // Set file size limit to 5MB
  }).single('mem_image');
  
  router.post('/upload-rider-image', (req, res, next) => {
    upload_file(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(200).json({ status: 0, msg: 'File upload error', error: err.message });
      } else if (err) {
        return res.status(200).json({ status: 0, msg: 'Server error', error: err.message });
      }
      // Continue with your logic if no error
      riderController.uploadRiderLicense(req, res);
    });
  });


module.exports = router;
