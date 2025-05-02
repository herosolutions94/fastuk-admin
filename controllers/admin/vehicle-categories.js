// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const VehicleCategories = require('../../models/vehicle-categories');
const { validateRequiredFields } = require('../../utils/validators');
const helpers = require('../../utils/helpers');


class VehicleCategoriesController extends BaseController {
    constructor() {
        super();
        this.vehicleCategories = new VehicleCategories();
    }

    async renderAddVehicleCategoryPage(req, res) {
        try {
            
            res.render('admin/add-vehicle-category',{
            }); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add Vehicle Category page:', error);
            return this.sendError(res, 'Failed to load add Vehicle Category page');
        }
    }

    async addVehicleCategory(req, res) {

        try {
            const {
                vehicle_name,
                status
            } = req.body;
            console.log("req.body",req.body);  // To check if name and description are being sent



            // Clean and trim data
            const cleanedData = {
                vehicle_name: typeof vehicle_name === 'string' ? vehicle_name.trim() : '',
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }
            // Create the rider
            const vehicleCategoryId = await this.vehicleCategories.createVehicleCategory(cleanedData);
            console.log('Created Post Code ID:', vehicleCategoryId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdVehicleCategory = await this.vehicleCategories.findById(vehicleCategoryId);
        console.log('Created Vehicle Category:', createdVehicleCategory); // Log the created rider
        res.json({
            status: 1,
            message: 'Vehicle Category added successfully!',
            redirect_url: '/admin/vehicle-categories-list'
        });


        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding Vehicle Category.',
                error: error.message
            });
        }
    ;
    }
    async getVehicleCategories(req, res) {
        try {
            const vehicleCategories = await VehicleCategories.getAllVehicleCategories();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            res.render('admin/vehicle-categories', { vehicleCategories: vehicleCategories || [] });
        } catch (error) {
            console.error('Error fetching Vehicle Categories:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch Vehicle Categories');
        }
    }

    async editVehicleCategory(req, res) {
        try {
            const vehicleCategoryId = req.params.id;  // Get the rider ID from the request parameters
            // console.log('Fetching vehicle with ID:', promoCodeId); // Log the ID
    
            // Fetch the rider by ID
            const vehicleCategory = (await VehicleCategories.getVehicleCategoriesById(vehicleCategoryId))[0]; // Extract the first rider if it's returned as an array
    
            // Check if rider exists
            if (vehicleCategory) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-vehicle-category', {
                    vehicleCategory, 
                    editVehicleCategoryId: vehicleCategoryId, 
                    status: vehicleCategory.status, // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Vehicle Category not found');
            }
        } catch (error) {
            console.error('Error fetching Vehicle Category:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch Vehicle Category');
        }
    }

    async updateVehicleCategory(req, res) {
        try {
            const vehicleCategoryId = req.params.id;
            const vehicleCategoryData = req.body;
    
            // Fetch the current testimonial details
            const currentVehicleCategory = (await VehicleCategories.getVehicleCategoriesById(vehicleCategoryId))[0];
    
            // Debugging output
            console.log('Current Remote Post Code:', currentVehicleCategory);
    
            // Update the service in the database
            await VehicleCategories.updateVehicleCategory(vehicleCategoryId, vehicleCategoryData);
    
            // Respond with success
            res.json({
                status: 1,
                message: 'Vehicle Category updated successfully!',
                redirect_url: '/admin/vehicle-categories-list'
            });
        } catch (error) {
            console.error('Failed to update Vehicle Category:', error);
            res.status(200).json({
                status: 0,
                message: 'Failed to update Vehicle Category'
            });
        }
    }
    
    async deleteVehicleCategory(req, res) {
        const vehicleCategoryId = req.params.id;
        console.log(vehicleCategoryId)
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentVehicleCategory = (await VehicleCategories.getVehicleCategoriesById(vehicleCategoryId))[0]; // Fetch current rider details
            if (!currentVehicleCategory) {
                return this.sendError(res, 'Promo Code not found');
            }
            console.log(currentVehicleCategory)

            // Step 3: Delete the rider from the database
            const result = await VehicleCategories.deleteVehicleCategoryById(vehicleCategoryId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Vehicle Category deleted successfully!',
                    redirect_url: '/admin/vehicle-categories-list'
                });            
            } else {
                this.sendError(res, 'Failed to delete Vehicle Category');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting Vehicle Category.',
                error: error.message
            });
        }
    }
    
}



module.exports = VehicleCategoriesController;
