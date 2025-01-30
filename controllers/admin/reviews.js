// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Reviews = require('../../models/reviews');
const { validateRequiredFields } = require('../../utils/validators');


class ReviewsController extends BaseController {
    constructor() {
        super();
        this.reviews = new Reviews();
    }

    
    async getReviews(req, res) {
        try {
          const reviewsWithMembers = await Reviews.getReviewsWithMembers();
      
          if (reviewsWithMembers && reviewsWithMembers.length > 0) {
            // console.log('reviews:', reviewsWithMembers); // Ensure data is logged here
            res.render('admin/reviews', { reviews: reviewsWithMembers });
          } else {
            // console.log('No reviews found'); // Debugging fallback
            res.render('admin/reviews', { reviews: [] }); // Render empty array if no data
          }
        } catch (error) {
          console.error('Error fetching reviews with members:', error);
          res.render('admin/reviews', { reviews: [] }); // Render empty array on error
        }
      }
      

    async getReviewDetails(req, res) {
        try {
            const { id } = req.params; // Get the order ID from the route parameters
    
            const reviewDetails = await Reviews.getReviewDetailsById(id);
            console.log('reviewDetails:', reviewDetails); // Ensure data is logged here

    
            if (reviewDetails) {
                res.render('admin/review-details', { review: reviewDetails });
            } else {
                this.sendError(res, 'review not found');
            }
        } catch (error) {
            console.error('Error fetching review details:', error);
            this.sendError(res, 'Failed to fetch review details');
        }
    }
    
    

    
    async deleteReview(req, res) {
        const reviewId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentReview = (await Reviews.getReviewsById(reviewId))[0]; // Fetch current rider details
            if (!currentReview) {
                return this.sendError(res, 'Review not found');
            }

            // Step 3: Delete the rider from the database
            const result = await Reviews.deleteReviewById(reviewId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Review deleted successfully!',
                    redirect_url: '/admin/reviews-list'
                });            
            } else {
                this.sendError(res, 'Failed to delete review');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting review.',
                error: error.message
            });
        }
    }
    
}



module.exports = ReviewsController;
