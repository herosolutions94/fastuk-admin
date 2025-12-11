// routes/api.js
const express = require('express');
const CancelledQuoteController = require('../../controllers/admin/cancelled_quotes');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


const router = express.Router();
const cancelledQuoteController = new CancelledQuoteController();


router.get('/cancelled-quotes', ensureAuthenticated, checkAccessMiddleware(5), cancelledQuoteController.getCancelledQuotes.bind(cancelledQuoteController));
router.post('/cancelled-quotes/handle', ensureAuthenticated, checkAccessMiddleware(5), cancelledQuoteController.handleCancellation.bind(cancelledQuoteController));



module.exports = router;
