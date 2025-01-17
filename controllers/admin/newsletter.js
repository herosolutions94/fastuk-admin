

const Newsletter = require('../../models/newsletter');
const BaseController = require('../baseController');

class NewsletterController extends BaseController {
    // Method to get the riders and render them in the view
    async getSubscribers(req, res) {
        try {
            // Update the status of all subscribers to 1
            await Newsletter.updateAllSubscribersStatus(1);

            // Fetch all subscribers after updating their status
            const subscribers = await Newsletter.getAllSubscribers();

            // Render the view with the updated subscribers
            res.render('admin/newsletter', { subscribers: subscribers || [] });
        } catch (error) {
            console.error('Error fetching subscribers:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch subscribers');
        }
    }


     // Method to delete a subscriber by ID
     async deleteSubscriber(req, res) {
        const { id } = req.params; // Get the ID from the request parameters
        try {
            await Newsletter.deleteSubscriberById(id); // Call the model method to delete the subscriber

            // After deletion, redirect or send a success message
            res.redirect('/admin/newsletter'); // Redirect to the newsletter page (adjust path if necessary)
        } catch (error) {
            console.error('Error deleting subscriber:', error); // Log the error
            this.sendError(res, 'Failed to delete subscriber');
        }
    }
    

}


module.exports = new NewsletterController();
