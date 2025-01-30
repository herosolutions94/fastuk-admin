// routes/api.js
const express = require('express');
const ReviewsController = require('../../controllers/admin/reviews');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const reviewsController = new ReviewsController();


router.get('/reviews-list', ensureAuthenticated, reviewsController.getReviews.bind(reviewsController));
router.get('/review-details/:id', ensureAuthenticated, upload, reviewsController.getReviewDetails.bind(reviewsController));
router.delete('/reviews/delete/:id', ensureAuthenticated, reviewsController.deleteReview.bind(reviewsController));




module.exports = router;
