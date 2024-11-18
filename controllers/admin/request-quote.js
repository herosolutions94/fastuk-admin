// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const RequestQuote = require('../../models/request-quote');
const { validateRequiredFields } = require('../../utils/validators');


class RequestQuoteController extends BaseController {
    constructor() {
        super();
        this.requestQuote = new RequestQuote();
    }

    
    async getRequestQuotes(req, res) {
        try {
            const requestQuotesWithMembers = await RequestQuote.getRequestQuotesWithMembers();
    
            if (requestQuotesWithMembers && requestQuotesWithMembers.length > 0) {
                res.render('admin/request-quotes', { requestQuotes: requestQuotesWithMembers });
            } else {
                this.sendError(res, 'No request quotes found');
            }
        } catch (error) {
            console.error('Error fetching request quotes with members:', error);
            this.sendError(res, 'Failed to fetch request quotes');
        }
    }
    

    
    async deleteRequestQuote(req, res) {
        const requestQuoteId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentRequestQuote = (await RequestQuote.getRequestQuoteById(requestQuoteId))[0]; // Fetch current rider details
            if (!currentRequestQuote) {
                return this.sendError(res, 'Request Quote not found');
            }

            // Step 3: Delete the rider from the database
            const result = await RequestQuote.deleteRequestQuoteById(requestQuoteId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Request Quote deleted successfully!',
                    redirect_url: '/admin/request-quotes-list'
                });            
            } else {
                this.sendError(res, 'Failed to delete request quote');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting request quote.',
                error: error.message
            });
        }
    }
    
}



module.exports = RequestQuoteController;
