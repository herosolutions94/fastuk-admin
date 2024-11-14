// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const RemotePostCode = require('../../models/remote-post-code');
const { validateRequiredFields } = require('../../utils/validators');


class RemotePostCodeController extends BaseController {
    constructor() {
        super();
        this.remotePostCode = new RemotePostCode();
    }

    renderAddRemotePostCodePage(req, res) {
        try {
            res.render('admin/add-remote-post-code'); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add post code page:', error);
            return this.sendError(res, 'Failed to load add post code page');
        }
    }

    async addRemotePostCode(req, res) {

        try {
            const {
                title,
                status,
            } = req.body;
            console.log("req.body",req.body);  // To check if name and description are being sent

            // Clean and trim data
            const cleanedData = {
                title: typeof title === 'string' ? title.trim() : '',
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }
            // Create the rider
            const remotePostCodeId = await this.remotePostCode.createRemotePostCode(cleanedData);
            console.log('Created Post Code ID:', remotePostCodeId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdRemotePostCode = await this.remotePostCode.findById(remotePostCodeId);
        console.log('Created Post Code:', createdRemotePostCode); // Log the created rider
        res.json({
            status: 1,
            message: 'Post Code added successfully!',
            redirect_url: '/admin/remote-post-codes-list'
        });


        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding Post Code.',
                error: error.message
            });
        }
    ;
    }
    async getRemotePostCodes(req, res) {
        try {
            const remotePostCodes = await RemotePostCode.getAllRemotePostCodes();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            if (remotePostCodes && remotePostCodes.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/remote-post-codes', { remotePostCodes: remotePostCodes || [] });
            } else {
                this.sendError(res, 'No remote post code found');
            }
        } catch (error) {
            console.error('Error fetching remote post codes:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch remote post codes');
        }
    }

    async editRemotePostCode(req, res) {
        try {
            const remotePostCodeId = req.params.id;  // Get the rider ID from the request parameters
            console.log('Fetching vehicle with ID:', remotePostCodeId); // Log the ID
    
            // Fetch the rider by ID
            const remotePostCode = (await RemotePostCode.getRemotePostCodeById(remotePostCodeId))[0]; // Extract the first rider if it's returned as an array
            console.log('Fetched remote Post Code:', remotePostCode); // Log fetched rider data

            console.log('remote Post Code data before rendering:', remotePostCode); // Log the rider data

    
            // Check if rider exists
            if (remotePostCode) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-remote-post-code', {
                    remotePostCode, 
                    editRemotePostCodeId: remotePostCodeId, 
                    status: remotePostCode.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'remote Post Code not found');
            }
        } catch (error) {
            console.error('Error fetching remote Post Code:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch remote Post Code');
        }
    }

    async updateRemotePostCode(req, res) {
        try {
            const remotepostCodeId = req.params.id;
            const remotePostCodeData = req.body;
    
            // Fetch the current testimonial details
            const currentRemotePostCode = (await RemotePostCode.getRemotePostCodeById(remotepostCodeId))[0];
    
            // Debugging output
            console.log('Current Remote Post Code:', currentRemotePostCode);
    
            // Update the service in the database
            await RemotePostCode.updateRemotePostCode(remotepostCodeId, remotePostCodeData);
    
            // Respond with success
            res.json({
                status: 1,
                message: 'Remote Post Code updated successfully!',
                redirect_url: '/admin/remote-post-codes-list'
            });
        } catch (error) {
            console.error('Failed to update Post Code:', error);
            res.status(200).json({
                status: 0,
                message: 'Failed to update Post Code'
            });
        }
    }
    
    async deleteRemotePostCode(req, res) {
        const remotepostCodeId = req.params.id;
        console.log(remotepostCodeId)
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentRemotePostCode = (await RemotePostCode.getRemotePostCodeById(remotepostCodeId))[0]; // Fetch current rider details
            if (!currentRemotePostCode) {
                return this.sendError(res, 'Remote Post Code not found');
            }
            console.log(currentRemotePostCode)

            // Step 3: Delete the rider from the database
            const result = await RemotePostCode.deleteRemotePostCodeById(remotepostCodeId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Remote Post Code deleted successfully!',
                    redirect_url: '/admin/remote-post-codes-list'
                });            
            } else {
                this.sendError(res, 'Failed to delete Remote Post Code');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting Remote Post Code.',
                error: error.message
            });
        }
    }
    
}



module.exports = RemotePostCodeController;
