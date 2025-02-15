// routes/api.js
const express = require('express');
const newsletterController = require('../../controllers/admin/newsletter');
const upload = require('../../file-upload');

const router = express.Router();


router.get('/newsletter-list', upload, newsletterController.getSubscribers.bind(newsletterController));
router.delete('/subscribers/delete/:id', upload, newsletterController.deleteSubscriber.bind(newsletterController));








module.exports = router;
