// routes/api.js
const express = require('express');
const TestimonialController = require('../../controllers/admin/testimonial');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const testimonialController = new TestimonialController();

router.get('/add-form', testimonialController.renderAddTestimonialPage.bind(testimonialController));

router.post('/add-testimonials', ensureAuthenticated, upload, testimonialController.addTestimonial.bind(testimonialController));
router.get('/testimonials-list', ensureAuthenticated, testimonialController.getTestimonials.bind(testimonialController));
router.get('/testimonials/edit/:id', ensureAuthenticated, upload, testimonialController.editTestimonial.bind(testimonialController)); // Edit form
router.post('/testimonials/update/:id', ensureAuthenticated, upload, testimonialController.updateTestimonial.bind(testimonialController)); // Update rider
router.delete('/testimonials/delete/:id', ensureAuthenticated, testimonialController.deleteTestimonial.bind(testimonialController));




module.exports = router;
