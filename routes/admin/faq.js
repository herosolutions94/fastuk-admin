// routes/api.js
const express = require('express');
const FaqController = require('../../controllers/admin/faq');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');

const upload = require('../../file-upload');

const router = express.Router();
const faqController = new FaqController();

router.get('/add-faq-form', ensureAuthenticated, faqController.renderAddFaqPage.bind(faqController));

router.post('/add-faqs', ensureAuthenticated, upload, faqController.addFaq.bind(faqController));
router.get('/faqs-list', ensureAuthenticated, faqController.getFaqs.bind(faqController));
router.get('/faqs/edit/:id', ensureAuthenticated, upload, faqController.editFaq.bind(faqController)); // Edit form
router.post('/faqs/update/:id', ensureAuthenticated, upload, faqController.updateFaq.bind(faqController)); // Update rider
router.delete('/faqs/delete/:id', ensureAuthenticated, faqController.deleteFaq.bind(faqController));




module.exports = router;
