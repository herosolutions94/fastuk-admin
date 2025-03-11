// routes/api.js
const express = require('express');
const RequestQuoteController = require('../../controllers/admin/request-quote');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


const router = express.Router();
const requestQuoteController = new RequestQuoteController();


router.get('/completed-jobs', ensureAuthenticated, checkAccessMiddleware(5), requestQuoteController.getCompletedRequestQuotes.bind(requestQuoteController));
router.get('/inprogress-jobs', ensureAuthenticated, checkAccessMiddleware(5), requestQuoteController.getInProgressRequestQuotes.bind(requestQuoteController));
router.get('/upcoming-jobs', ensureAuthenticated,checkAccessMiddleware(5), requestQuoteController.getUpcomingRequestQuotes.bind(requestQuoteController));
router.get('/job-detail/:id', ensureAuthenticated,checkAccessMiddleware(5), requestQuoteController.getOrderDetails.bind(requestQuoteController));
router.delete('/request-quotes/delete/:id', ensureAuthenticated,checkAccessMiddleware(5), requestQuoteController.deleteRequestQuote.bind(requestQuoteController));




module.exports = router;
