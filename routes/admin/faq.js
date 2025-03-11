// routes/api.js
const express = require('express');
const FaqController = require('../../controllers/admin/faq');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');

const upload = require('../../file-upload');

const router = express.Router();
const faqController = new FaqController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/faqs/add', ensureAuthenticated,checkAccessMiddleware(13), faqController.renderAddFaqPage.bind(faqController));

router.post('/add-faqs', ensureAuthenticated,checkAccessMiddleware(13), upload, faqController.addFaq.bind(faqController));
router.get('/faqs', ensureAuthenticated,checkAccessMiddleware(13), faqController.getFaqs.bind(faqController));
router.get('/faqs/edit/:id', ensureAuthenticated, checkAccessMiddleware(13),upload, faqController.editFaq.bind(faqController)); // Edit form
router.post('/faqs/update/:id', ensureAuthenticated,checkAccessMiddleware(13), upload, faqController.updateFaq.bind(faqController)); // Update rider
router.delete('/faqs/delete/:id', ensureAuthenticated,checkAccessMiddleware(13), faqController.deleteFaq.bind(faqController));




module.exports = router;
