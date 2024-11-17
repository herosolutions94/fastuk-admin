// routes/api.js
const express = require('express');
const RequestQuoteController = require('../../controllers/admin/request-quote');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const requestQuoteController = new RequestQuoteController();

router.get('/add-vehicle-form', requestQuoteController.renderAddVehiclePage.bind(requestQuoteController));

router.get('/request-quotes-list', ensureAuthenticated, requestQuoteController.getRequestQuotes.bind(requestQuoteController));
router.delete('/request-quotes/delete/:id', ensureAuthenticated, requestQuoteController.deleteRequestQuote.bind(requestQuoteController));




module.exports = router;
