// routes/api.js
const express = require('express');
const RequestQuoteController = require('../../controllers/admin/request-quote');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const requestQuoteController = new RequestQuoteController();


router.get('/completed-jobs', ensureAuthenticated, requestQuoteController.getCompletedRequestQuotes.bind(requestQuoteController));
router.get('/inprogress-jobs', ensureAuthenticated, requestQuoteController.getInProgressRequestQuotes.bind(requestQuoteController));
router.get('/upcoming-jobs', ensureAuthenticated, requestQuoteController.getUpcomingRequestQuotes.bind(requestQuoteController));
router.get('/job-detail/:id', ensureAuthenticated, requestQuoteController.getOrderDetails.bind(requestQuoteController));
router.delete('/request-quotes/delete/:id', ensureAuthenticated, requestQuoteController.deleteRequestQuote.bind(requestQuoteController));




module.exports = router;
