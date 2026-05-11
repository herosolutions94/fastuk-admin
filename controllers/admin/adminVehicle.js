// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const helpers = require('../../utils/helpers');

const BaseController = require('../baseController');
const Vehicle = require('../../models/vehicle');
const { validateRequiredFields } = require('../../utils/validators');
const message = require('./message');
const VehicleCategories = require('../../models/vehicle-categories');



class adminVehicleController extends BaseController {
    constructor() {
        super();
        this.vehicle = new Vehicle();
        this.vehicleCategories = new VehicleCategories();
    }

    async renderAdminAddVehiclePage(req, res) {
        try {

            res.render('admin/add-admin-vehicle', {}); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add vehicle page:', error);
            return this.sendError(res, 'Failed to load add vehicle page');
        }
    }

    async addAdminVehicle(req, res) {

        try {
            const {
                title,

                status,
                vehicle_registration_number,
                make_model,
                vehicle_rental_price,
                vehicle_type,
            } = req.body;
            // console.log("req.body",req.body);  // To check if name and description are being sent


            const vehicleImage = req.files && req.files["vehicle_image"] ? req.files["vehicle_image"][0].filename : '';



            if (vehicleImage) {
                const sourceDir = path.join(__dirname, '../../uploads');
                const thumbFolder = 'thumbnails';
                const width = 300;
                const height = 300;

                // ✅ Generate the thumbnail using your helper
                await helpers.generateThumbnail(vehicleImage, sourceDir, thumbFolder, width, height);
                // console.log('Thumbnail created for:', vehicleImage);

                // Update with new image

            }


            // Clean and trim data
            const cleanedData = {
                title: typeof title === 'string' ? title.trim() : '',
                vehicle_registration_number: typeof vehicle_registration_number === 'string' ? vehicle_registration_number.trim().toLowerCase() : '',
                make_model: typeof make_model === 'string' ? make_model.trim().toLowerCase() : '',
                vehicle_rental_price: typeof vehicle_rental_price === 'string' ? vehicle_rental_price.trim().toLowerCase() : '',
                vehicle_image: vehicleImage,  // Change this to match your DB column name
                status: status || 0,
                vehicle_type: "admin",

            };
            // console.log(cleanedData,"cleanedData")

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ status: 0, msg: 'All fields are required!', message: "All fields are required!" });
            }
            // Create the rider
            const vehicleId = await this.vehicle.createVehicle(cleanedData);


           
            res.json({
                status: 1,
                message: 'Vehicle added successfully!',
                redirect_url: '/admin/admin-vehicles-list'
            });
            // res.redirect('/admin/vehicles-list');


        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding vehicle.',
                error: error.message
            });
        }
        ;
    }
    async getAdminVehicles(req, res) {
        try {
            const adminVehicles = await Vehicle.getAdminVehicles();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            // if (vehicles && vehicles.length > 0) {
            // Corrected res.render with only two arguments
            res.render('admin/admin-vehicles', { adminVehicles: adminVehicles || [] });

            // } else {
            //     this.sendError(res, 'No vehicles found');
            // }
        } catch (error) {
            console.error('Error fetching vehicles:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch vehicles');
        }
    }

    async editAdminVehicle(req, res) {
        try {
            const vehicleId = req.params.id;  // Get the rider ID from the request parameters
            // console.log('Fetching vehicle with ID:', vehicleId); // Log the ID

            // Fetch the rider by ID
            const vehicle = (await Vehicle.getAdminVehicleById(vehicleId))[0]; // Extract the first rider if it's returned as an array
            // console.log('Fetched vehicle:', vehicle); // Log fetched rider data



            // console.log('Vehicle data before rendering:', vehicle); // Log the rider data

            if (!vehicle) {
                return res.redirect('/admin/admin-vehicles-list');
            }



            // Check if rider exists
            if (vehicle) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-admin-vehicle', {
                    vehicle,
                    editVehicleId: vehicleId,
                    imageFilenames: [vehicle.vehicle_image], // Make sure to access the rider image correctly
                    status: vehicle.status // Pass the status to the view

                });
            } else {
                res.redirect('/admin/admin-vehicles-list'); // 🔁 change this path as per your route
            }
        } catch (error) {
            console.error('Error fetching vehicle:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch vehicle');
        }
    }

    async updateAdminVehicle(req, res) {
        try {
            const vehicleId = req.params.id;
            const vehicleData = req.body;


            // Fetch the current testimonial details
            const currentVehicle = (await Vehicle.getAdminVehicleById(vehicleId))[0];

            // Check if a new image is uploaded
            const vehicleImage = req.files && req.files["vehicle_image"] ? req.files["vehicle_image"][0].filename : null;

            // Handle image replacement
            if (vehicleImage) {
                // If there is an old image, delete it
                if (currentVehicle.vehicle_image) {
                    const oldImagePath = path.join(__dirname, '../../uploads/', currentVehicle.vehicle_image);
                    const oldThumbPath = path.join(__dirname, '../../uploads/thumbnails/', currentVehicle.vehicle_image);


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
                    // Delete old thumbnail if it exists
                    if (fs.existsSync(oldThumbPath)) {
                        fs.unlink(oldThumbPath, (err) => {
                            if (err) console.error('Error deleting old thumbnail:', err);
                            else console.log('Old thumbnail deleted successfully');
                        });
                    } else {
                        console.log('Old thumbnail file not found:', oldThumbPath);
                    }

                }

                // Update the vehicle data with the new image filename
                vehicleData.vehicle_image = vehicleImage;
            } else {
                // If no new image is uploaded, retain the old image
                vehicleData.vehicle_image = currentVehicle.vehicle_image;
            }

            // If a new image is uploaded, generate a thumbnail
            if (vehicleImage) {
                const sourceDir = path.join(__dirname, '../../uploads');
                const thumbFolder = 'thumbnails';
                const width = 300;
                const height = 300;

                // ✅ Generate the thumbnail using your helper
                await helpers.generateThumbnail(vehicleImage, sourceDir, thumbFolder, width, height);
                // console.log('Thumbnail created for:', vehicleImage);

                // Update with new image
                vehicleData.vehicle_image = vehicleImage;
            } else {
                // Retain old image
                vehicleData.vehicle_image = currentVehicle.vehicle_image;
            }


            // Update the service in the database
            await Vehicle.updateAdminVehicle(vehicleId, vehicleData);

            // Respond with success
            res.json({
                status: 1,
                message: 'Vehicle updated successfully!',
                redirect_url: '/admin/admin-vehicles-list'
            });
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            res.status(200).json({
                status: 0,
                message: 'Failed to update vehicle'
            });
        }
    }

    async deleteAdminVehicle(req, res) {
        const vehicleId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentVehicle = (await Vehicle.getAdminVehicleById(vehicleId))[0]; // Fetch current rider details
            if (!currentVehicle) {
                return this.sendError(res, 'Vehicle not found');
            }

            const vehicleImage = currentVehicle.vehicle_image; // Get the image filename
            // console.log('vehicle to delete:', currentVehicle); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (vehicleImage) {
                const imagePath = path.join(__dirname, '../../uploads/', vehicleImage);
                const thumbPath = path.join(__dirname, '../../uploads/thumbnails/', vehicleImage);

                // console.log('Image Path:', imagePath); // Log the image path

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
                if (fs.existsSync(thumbPath)) {
                    fs.unlink(thumbPath, (err) => {
                        if (err) console.error('Error deleting thumbnail:', err);
                        else console.log('Thumbnail deleted successfully');
                    });
                } else {
                    console.log('Thumbnail file not found:', thumbPath);
                }

            }

            // Step 3: Delete the rider from the database
            const result = await Vehicle.deleteAdminVehicleById(vehicleId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Vehicle deleted successfully!',
                    redirect_url: '/admin/admin-vehicles-list'
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



module.exports = adminVehicleController;

