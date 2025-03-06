// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Vehicle = require('../../models/vehicle');
const { validateRequiredFields } = require('../../utils/validators');
const message = require('./message');


class VehicleController extends BaseController {
    constructor() {
        super();
        this.vehicle = new Vehicle();
    }

    renderAddVehiclePage(req, res) {
        try {
            res.render('admin/add-vehicle'); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add vehicle page:', error);
            return this.sendError(res, 'Failed to load add vehicle page');
        }
    }

    async addVehicle(req, res) {

        try {
            const {
                title,
                price,
                business_user_price,
                admin_price,
                // remote_price,
                status,
            } = req.body;
            console.log("req.body",req.body);  // To check if name and description are being sent


            const vehicleImage = req.files && req.files["vehicle_image"] ? req.files["vehicle_image"][0].filename : '';
            console.log("req.file:",req.file);  // To check if the file is being uploaded


            // Clean and trim data
            const cleanedData = {
                title: typeof title === 'string' ? title.trim() : '',
                price: typeof price === 'string' ? price.trim().toLowerCase() : '',
                business_user_price: typeof business_user_price === 'string' ? business_user_price.trim().toLowerCase() : '',
                admin_price: typeof admin_price === 'string' ? admin_price.trim().toLowerCase() : '',
                // remote_price: typeof remote_price === 'string' ? remote_price.trim().toLowerCase() : '',
                vehicle_image: vehicleImage,  // Change this to match your DB column name
                status: status || 0,
            };
            console.log(cleanedData,"cleanedData")

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ status: 0, msg: 'All fields are required.' });
            }
            // Create the rider
            const vehicleId = await this.vehicle.createVehicle(cleanedData);
            console.log('Created Vehicle ID:', vehicleId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdVehicle = await this.vehicle.findById(vehicleId);
        console.log('Created vehicle:', createdVehicle); // Log the created rider
        res.json({
            status: 1,
            message: 'Vehicle added successfully!',
            redirect_url: '/admin/vehicles-list'
        });


        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding vehicle.',
                error: error.message
            });
        }
    ;
    }
    async getVehicles(req, res) {
        try {
            const vehicles = await Vehicle.getAllVehicles();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            // if (vehicles && vehicles.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/vehicles', { vehicles: vehicles || [] });
            
            // } else {
            //     this.sendError(res, 'No vehicles found');
            // }
            }catch (error) {
            console.error('Error fetching vehicles:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch vehicles');
        }
    }

    async editVehicle(req, res) {
        try {
            const vehicleId = req.params.id;  // Get the rider ID from the request parameters
            console.log('Fetching vehicle with ID:', vehicleId); // Log the ID
    
            // Fetch the rider by ID
            const vehicle = (await Vehicle.getVehicleById(vehicleId))[0]; // Extract the first rider if it's returned as an array
            console.log('Fetched vehicle:', vehicle); // Log fetched rider data

            console.log('Vehicle data before rendering:', vehicle); // Log the rider data

    
            // Check if rider exists
            if (vehicle) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-vehicle', {
                    vehicle, 
                    editVehicleId: vehicleId, 
                    imageFilenames: [vehicle.vehicle_image], // Make sure to access the rider image correctly
                    status: vehicle.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'vehicle not found');
            }
        } catch (error) {
            console.error('Error fetching vehicle:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch vehicle');
        }
    }

    async updateVehicle(req, res) {
        try {
            const vehicleId = req.params.id;
            const vehicleData = req.body;
    
            // Fetch the current testimonial details
            const currentVehicle = (await Vehicle.getVehicleById(vehicleId))[0];
    
            // Debugging output
            console.log('Current Vehicle:', currentVehicle);
            
            // Check if a new image is uploaded
            const vehicleImage = req.files && req.files["vehicle_image"] ? req.files["vehicle_image"][0].filename : null;
    
            // Debugging output
            console.log('New service image:', vehicleImage);
    
            // Handle image replacement
            if (vehicleImage) {
                // If there is an old image, delete it
                if (currentVehicle.vehicle_image) {
                    const oldImagePath = path.join(__dirname, '../../uploads/', currentVehicle.vehicle_image);
                    
                    // Check if the old image file exists before trying to delete
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlink(oldImagePath, (err) => {
                            if (err) {
                                console.error('Error deleting old image:', err);
                            } else {
                                console.log('Old image deleted successfully');
                            }
                        });
                    } else {
                        console.log('Old image file not found:', oldImagePath);
                    }
                }
    
                // Update the testimonial data with the new image filename
                vehicleData.vehicle_image = vehicleImage;
            } else {
                // If no new image is uploaded, retain the old image
                vehicleData.vehicle_image = currentVehicle.vehicle_image;
            }
    
            // Update the service in the database
            await Vehicle.updateVehicle(vehicleId, vehicleData);
    
            // Respond with success
            res.json({
                status: 1,
                message: 'Vehicle updated successfully!',
                redirect_url: '/admin/vehicles-list'
            });
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            res.status(200).json({
                status: 0,
                message: 'Failed to update vehicle'
            });
        }
    }
    
    async deleteVehicle(req, res) {
        const vehicleId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentVehicle = (await Vehicle.getVehicleById(vehicleId))[0]; // Fetch current rider details
            if (!currentVehicle) {
                return this.sendError(res, 'Vehicle not found');
            }

            const vehicleImage = currentVehicle.vehicle_image; // Get the image filename
            console.log('vehicle to delete:', currentVehicle); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (vehicleImage) {
                const imagePath = path.join(__dirname, '../../uploads/', vehicleImage);
                console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                    console.log('Image found. Deleting now...');
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error('Error deleting vehicle image:', err); // Log the error if deletion fails
                        } else {
                            console.log('Vehicle image deleted successfully');
                        }
                    });
                } else {
                    console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
                }
            }

            // Step 3: Delete the rider from the database
            const result = await Vehicle.deleteVehicleById(vehicleId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Vehicle deleted successfully!',
                    redirect_url: '/admin/vehicles-list'
                });            
            } else {
                this.sendError(res, 'Failed to delete vehicle');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting vehicle.',
                error: error.message
            });
        }
    }
    
}



module.exports = VehicleController;
