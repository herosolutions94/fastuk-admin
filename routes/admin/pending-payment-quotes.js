// routes/api.js
const express = require('express');
const PendingPaymentQuoteController = require('../../controllers/admin/pending-payment-quotes');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');

const router = express.Router();
const pendingPaymentQuoteController = new PendingPaymentQuoteController();



router.get('/pending-payment-quotes', ensureAuthenticated, checkAccessMiddleware(5), pendingPaymentQuoteController.getPendingPaymentQuotes.bind(pendingPaymentQuoteController));
router.post('/pending-payment/resolve', ensureAuthenticated, checkAccessMiddleware(5), pendingPaymentQuoteController.handlePendingPayment.bind(pendingPaymentQuoteController));




module.exports = router;
