// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const PromoCode = require('../../models/promo-code');
const { validateRequiredFields } = require('../../utils/validators');
const helpers = require('../../utils/helpers');


class PromoCodeController extends BaseController {
    constructor() {
        super();
        this.promoCode = new PromoCode();
    }

    async renderAddPromoCodePage(req, res) {
        try {
            const promoCode = await helpers.generatePromoCode()
            
            res.render('admin/add-promo-code',{
                promoCode
            }); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add post code page:', error);
            return this.sendError(res, 'Failed to load add post code page');
        }
    }

    async addPromoCode(req, res) {

        try {
            const {
                promo_code,
                promo_code_type,
                percentage_value,
                expiry_date,
                status
            } = req.body;
            console.log("req.body",req.body);  // To check if name and description are being sent

            const validPromoTypes = ['percentage', 'amount'];


            // Clean and trim data
            const cleanedData = {
                promo_code: typeof promo_code === 'string' ? promo_code.trim() : '',
                promo_code_type: typeof promo_code_type === 'string' && validPromoTypes.includes(promo_code_type.trim())
                ? promo_code_type.trim()
                : null, // or default to one of the enum values, or throw an error
                percentage_value: typeof percentage_value === 'string' ? percentage_value.trim() : '',
                expiry_date : expiry_date ? new Date(expiry_date).toISOString().slice(0, 10) : null,
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }
            // Create the rider
            const promoCodeId = await this.promoCode.createPromoCode(cleanedData);
            console.log('Created Post Code ID:', promoCodeId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdPromoCode = await this.promoCode.findById(promoCodeId);
        console.log('Created Post Code:', createdPromoCode); // Log the created rider
        res.json({
            status: 1,
            message: 'Post Code added successfully!',
            redirect_url: '/admin/promo-codes-list'
        });


        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding Promo Code.',
                error: error.message
            });
        }
    ;
    }
    async getPromoCodes(req, res) {
        try {
            const promoCodes = await PromoCode.getAllPromoCodes();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            res.render('admin/promo-codes', { promoCodes: promoCodes || [] });
        } catch (error) {
            console.error('Error fetching remote post codes:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch remote post codes');
        }
    }

    async editPromoCode(req, res) {
        try {
            const promoCodeId = req.params.id;  // Get the rider ID from the request parameters
            // console.log('Fetching vehicle with ID:', promoCodeId); // Log the ID
    
            // Fetch the rider by ID
            const promoCode = (await PromoCode.getPromoCodeById(promoCodeId))[0]; // Extract the first rider if it's returned as an array
            // console.log('Fetched remote Post Code:', promoCode); // Log fetched rider data
            // Assuming you have fetched the expiry_date from MySQL (e.g., '2025-04-25')
            let formattedExpiryDate = promoCode.expiry_date ? promoCode.expiry_date.toISOString().slice(0, 10) : ''; 

    
            // Check if rider exists
            if (promoCode) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-promo-code', {
                    promoCode, 
                    editPromoCodeId: promoCodeId, 
                    status: promoCode.status, // Pass the status to the view
                    promo_code_type: promoCode.promo_code_type ,
                    formattedExpiryDate

                });
            } else {
                this.sendError(res, 'Promo Code not found');
            }
        } catch (error) {
            console.error('Error fetching Promo Code:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch Promo Code');
        }
    }

    async updatePromoCode(req, res) {
        try {
            const promoCodeId = req.params.id;
            const promoCodeData = req.body;
    
            // Fetch the current testimonial details
            const currentPromoCode = (await PromoCode.getPromoCodeById(promoCodeId))[0];
    
            // Debugging output
            console.log('Current Remote Post Code:', currentPromoCode);
    
            // Update the service in the database
            await PromoCode.updatePromoCode(promoCodeId, promoCodeData);
    
            // Respond with success
            res.json({
                status: 1,
                message: 'Remote Promo Code updated successfully!',
                redirect_url: '/admin/promo-codes-list'
            });
        } catch (error) {
            console.error('Failed to update Promo Code:', error);
            res.status(200).json({
                status: 0,
                message: 'Failed to update Promo Code'
            });
        }
    }
    
    async deletePromoCode(req, res) {
        const promoCodeId = req.params.id;
        console.log(promoCodeId)
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentPromoCode = (await PromoCode.getPromoCodeById(promoCodeId))[0]; // Fetch current rider details
            if (!currentPromoCode) {
                return this.sendError(res, 'Promo Code not found');
            }
            console.log(currentPromoCode)

            // Step 3: Delete the rider from the database
            const result = await PromoCode.deletePromoCodeById(promoCodeId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Promo Code deleted successfully!',
                    redirect_url: '/admin/promo-codes-list'
                });            
            } else {
                this.sendError(res, 'Failed to delete Promo Code');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting Promo Code.',
                error: error.message
            });
        }
    }
    
}



module.exports = PromoCodeController;
