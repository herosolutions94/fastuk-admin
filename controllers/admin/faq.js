// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Faq = require('../../models/faq');
const { validateRequiredFields } = require('../../utils/validators');


class FaqController extends BaseController {
    constructor() {
        super();
        this.faq = new Faq();
    }

    renderAddFaqPage(req, res) {
        try {
            res.render('admin/add-faq'); // Render the add-faq.ejs file
        } catch (error) {
            console.error('Error rendering add faq page:', error);
            return this.sendError(res, 'Failed to load add faq page');
        }
    }

    async addFaq(req, res) {

        try {
            const {
                ques,
                ans,
                status,
            } = req.body;
            // console.log("req.body",req.body);  // To check if name and description are being sent


            // Clean and trim data
            const cleanedData = {
                ques: typeof ques === 'string' ? ques.trim() : '',
                ans: typeof ans === 'string' ? ans.trim() : '',
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }
            // Create the rider
            const faqId = await this.faq.createFaq(cleanedData);
            // console.log('Created faq ID:', faqId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdFaq = await this.faq.findById(faqId);
        this.sendSuccess(res, {}, 'Faq added successfully!', 200, '/admin/faqs')

        // console.log('Created faq:', createdFaq); // Log the created rider
        


        } catch (error) {
            console.error('Failed to add faq:', error);
            this.sendError(res, 'Failed to add faq');
        }
    ;
    }
    async getFaqs(req, res) {
        try {
            const faqs = await Faq.getAllFaqs();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            if (faqs && faqs.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/faqs', { faqs: faqs || [] });
            } else {
                this.sendError(res, 'No faqs found');
            }
        } catch (error) {
            console.error('Error fetching faqs:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch faqs');
        }
    }

    async editFaq(req, res) {
        try {
            const faqId = req.params.id;  // Get the rider ID from the request parameters
            // console.log('Fetching faq with ID:', faqId); // Log the ID
    
            // Fetch the rider by ID
            const faq = (await Faq.getFaqById(faqId))[0]; // Extract the first rider if it's returned as an array
            // console.log('Fetched faq:', faq); // Log fetched rider data

            // console.log('Faq data before rendering:', faq); // Log the rider data

    
            // Check if rider exists
            if (faq) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-faq', {
                    faq, 
                    editFaqId: faqId, 
                    status: faq.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Faq not found');
            }
        } catch (error) {
            console.error('Error fetching faq:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch faq');
        }
    }

    async updateFaq(req, res) {
        try {
            const faqId = req.params.id;
            const faqData = req.body;
    
            // Fetch the current testimonial details
            const currentFaq = (await Faq.getFaqById(faqId))[0];
    
            // Debugging output
            // console.log('Current faq:', currentFaq);

    
            // Update the testimonial in the database
            await Faq.updateFaq(faqId, faqData);
            this.sendSuccess(res, {}, 'Faq updated successfully!', 200, '/admin/faqs')

        } catch (error) {
            console.error('Failed to update faq:', error);
            this.sendError(res, 'Failed to update faq');
        }
    }
    
    async deleteFaq(req, res) {
        const faqId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentFaq = (await Faq.getFaqById(faqId))[0]; // Fetch current rider details
            if (!currentFaq) {
                return this.sendError(res, 'Faq not found');
            }

            // Step 3: Delete the rider from the database
            const result = await Faq.deleteFaqById(faqId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Faq deleted successfully!', 200, '/admin/faqs')

            } else {
                this.sendError(res, 'Failed to delete faq');
            }
        } catch (error) {
            console.error('Failed to delete faq:', error);
            this.sendError(res, 'Failed to delete faq');
            
        }
    }
    
}



module.exports = FaqController;
