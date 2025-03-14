// routes/api.js
const express = require('express');
const TestimonialController = require('../../controllers/admin/testimonial');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const testimonialController = new TestimonialController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/testimonial/add', checkAccessMiddleware(12), testimonialController.renderAddTestimonialPage.bind(testimonialController));

router.post('/add-testimonials', ensureAuthenticated, checkAccessMiddleware(12),upload, testimonialController.addTestimonial.bind(testimonialController));
router.get('/testimonial', ensureAuthenticated,checkAccessMiddleware(12),testimonialController.getTestimonials.bind(testimonialController));
router.get('/testimonial/edit/:id', ensureAuthenticated, checkAccessMiddleware(12), upload, testimonialController.editTestimonial.bind(testimonialController)); // Edit form
router.post('/testimonials/update/:id', ensureAuthenticated,checkAccessMiddleware(12), upload, testimonialController.updateTestimonial.bind(testimonialController)); // Update rider
router.delete('/testimonial/delete/:id', ensureAuthenticated,checkAccessMiddleware(12), testimonialController.deleteTestimonial.bind(testimonialController));





module.exports = router;
