// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Service = require('../../models/service');
const { validateRequiredFields } = require('../../utils/validators');


class ServiceController extends BaseController {
    constructor() {
        super();
        this.service = new Service();
    }

    renderAddServicePage(req, res) {
        try {
            res.render('admin/add-service'); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add service page:', error);
            return this.sendError(res, 'Failed to load add service page');
        }
    }

    async addService(req, res) {

        try {
            const {
                title,
                description,
                status,
            } = req.body;
            console.log("req.body",req.body);  // To check if name and description are being sent


            const serviceImage = req.files && req.files["service_image"] ? req.files["service_image"][0].filename : '';
            console.log("req.file:",req.file);  // To check if the file is being uploaded


            // Clean and trim data
            const cleanedData = {
                title: typeof title === 'string' ? title.trim() : '',
                description: typeof description === 'string' ? description.trim().toLowerCase() : '',
                service_image: serviceImage,  // Change this to match your DB column name
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }
            // Create the rider
            const serviceId = await this.service.createService(cleanedData);
            console.log('Created Service ID:', serviceId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdService = await this.service.findById(serviceId);
        console.log('Created Service:', createdService); // Log the created rider
        res.json({
            status: 1,
            message: 'Service added successfully!',
            redirect_url: '/admin/services'
        });


        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding service.',
                error: error.message
            });
        }
    ;
    }
    async getServices(req, res) {
        try {
            const services = await Service.getAllServices();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            if (services && services.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/services', { services: services || [] });
            } else {
                this.sendError(res, 'No services found');
            }
        } catch (error) {
            console.error('Error fetching services:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch services');
        }
    }

    async editService(req, res) {
        try {
            const serviceId = req.params.id;  // Get the rider ID from the request parameters
            console.log('Fetching service with ID:', serviceId); // Log the ID
    
            // Fetch the rider by ID
            const service = (await Service.getServiceById(serviceId))[0]; // Extract the first rider if it's returned as an array
            console.log('Fetched service:', service); // Log fetched rider data

            console.log('Service data before rendering:', service); // Log the rider data

    
            // Check if rider exists
            if (service) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-service', {
                    service, 
                    editServiceId: serviceId, 
                    imageFilenames: [service.service_image], // Make sure to access the rider image correctly
                    status: service.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Service not found');
            }
        } catch (error) {
            console.error('Error fetching service:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch service');
        }
    }

    async updateService(req, res) {
        try {
            const serviceId = req.params.id;
            const serviceData = req.body;
    
            // Fetch the current testimonial details
            const currentService = (await Service.getServiceById(serviceId))[0];
    
            // Debugging output
            console.log('Current Service:', currentService);
            
            // Check if a new image is uploaded
            const serviceImage = req.files && req.files["service_image"] ? req.files["service_image"][0].filename : null;
    
            // Debugging output
            console.log('New service image:', serviceImage);
    
            // Handle image replacement
            if (serviceImage) {
                // If there is an old image, delete it
                if (currentService.service_image) {
                    const oldImagePath = path.join(__dirname, '../../uploads/', currentService.service_image);
                    
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
                serviceData.service_image = serviceImage;
            } else {
                // If no new image is uploaded, retain the old image
                serviceData.service_image = currentService.service_image;
            }
    
            // Update the service in the database
            await Service.updateService(serviceId, serviceData);
    
            // Respond with success
            res.json({
                status: 1,
                message: 'Service updated successfully!',
                redirect_url: '/admin/services'
            });
        } catch (error) {
            console.error('Failed to update service:', error);
            res.status(500).json({
                status: 0,
                message: 'Failed to update service'
            });
        }
    }
    
    async deleteService(req, res) {
        const serviceId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentService = (await Service.getServiceById(serviceId))[0]; // Fetch current rider details
            if (!currentService) {
                return this.sendError(res, 'Service not found');
            }

            const serviceImage = currentService.service_image; // Get the image filename
            console.log('Service to delete:', currentService); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (serviceImage) {
                const imagePath = path.join(__dirname, '../../uploads/', serviceImage);
                console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                    console.log('Image found. Deleting now...');
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error('Error deleting service image:', err); // Log the error if deletion fails
                        } else {
                            console.log('Service image deleted successfully');
                        }
                    });
                } else {
                    console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
                }
            }

            // Step 3: Delete the rider from the database
            const result = await Service.deleteServiceById(serviceId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Service deleted successfully!',
                    redirect_url: '/admin/services-list'
                });            } else {
                this.sendError(res, 'Failed to delete service');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting service.',
                error: error.message
            });
        }
    }
    
}



module.exports = ServiceController;
