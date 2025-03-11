// routes/api.js
const express = require('express');
const ReviewsController = require('../../controllers/admin/reviews');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');


const router = express.Router();
const reviewsController = new ReviewsController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');



router.get('/reviews-list', ensureAuthenticated, checkAccessMiddleware(9), reviewsController.getReviews.bind(reviewsController));
router.get('/review-details/:id', ensureAuthenticated, checkAccessMiddleware(9), upload, reviewsController.getReviewDetails.bind(reviewsController));
router.delete('/reviews/delete/:id', ensureAuthenticated, checkAccessMiddleware(9), reviewsController.deleteReview.bind(reviewsController));




module.exports = router;
