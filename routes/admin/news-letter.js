// routes/api.js
const express = require('express');
const newsletterController = require('../../controllers/admin/newsletter');
const upload = require('../../file-upload');

const router = express.Router();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');



router.get('/newsletter-list', checkAccessMiddleware(16),upload, newsletterController.getSubscribers.bind(newsletterController));
router.delete('/subscribers/delete/:id',checkAccessMiddleware(16), upload, newsletterController.deleteSubscriber.bind(newsletterController));








module.exports = router;
