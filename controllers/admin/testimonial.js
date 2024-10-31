// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Testimonial = require('../../models/testimonial');
const { validateRequiredFields } = require('../../utils/validators');


class TestimonialController extends BaseController {
    constructor() {
        super();
        this.testimonial = new Testimonial();
    }

    renderAddTestimonialPage(req, res) {
        try {
            res.render('admin/add-testimonial'); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add testimonial page:', error);
            return this.sendError(res, 'Failed to load add testimonial page');
        }
    }

    async addTestimonial(req, res) {

        try {
            const {
                title,
                designation,
                description,
                status,
            } = req.body;
            console.log("req.body",req.body);  // To check if name and description are being sent


            const testimonialImage = req.files && req.files["testi_image"] ? req.files["testi_image"][0].filename : '';
            console.log("req.file:",req.file);  // To check if the file is being uploaded


            // Clean and trim data
            const cleanedData = {
                title: typeof title === 'string' ? title.trim() : '',
                designation: typeof designation === 'string' ? designation.trim() : '',
                description: typeof description === 'string' ? description.trim().toLowerCase() : '',
                testi_image: testimonialImage,  // Change this to match your DB column name
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }
            // Create the rider
            const testimonialId = await this.testimonial.createTestimonial(cleanedData);
            console.log('Created Testimonial ID:', testimonialId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdTestimonial = await this.testimonial.findById(testimonialId);
        console.log('Created Testimonial:', createdTestimonial); // Log the created rider
        res.json({
            status: 1,
            message: 'Testimonial added successfully!',
            redirect_url: '/admin/testimonials-list'
        });


        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding testimonial.',
                error: error.message
            });
        }
    ;
    }
    async getTestimonials(req, res) {
        try {
            const testimonials = await Testimonial.getAllTestimonials();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            if (testimonials && testimonials.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/testimonials', { testimonials: testimonials || [] });
            } else {
                this.sendError(res, 'No riders found');
            }
        } catch (error) {
            console.error('Error fetching testimonials:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch testimonials');
        }
    }

    async editTestimonial(req, res) {
        try {
            const testimonialId = req.params.id;  // Get the rider ID from the request parameters
            console.log('Fetching rider with ID:', testimonialId); // Log the ID
    
            // Fetch the rider by ID
            const testimonial = (await Testimonial.getTestimonialById(testimonialId))[0]; // Extract the first rider if it's returned as an array
            console.log('Fetched testimonial:', testimonial); // Log fetched rider data

            console.log('Testimonial data before rendering:', testimonial); // Log the rider data

            

    
            // Check if rider exists
            if (testimonial) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-testimonial', {
                    testimonial, 
                    editTestimonialId: testimonialId, 
                    imageFilenames: [testimonial.testi_image], // Make sure to access the rider image correctly
                    status: testimonial.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Rider not found');
            }
        } catch (error) {
            console.error('Error fetching rider:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch rider');
        }
    }

    async updateTestimonial(req, res) {
        try {
            const testimonialId = req.params.id;
            const testimonialData = req.body;
    
            // Fetch the current testimonial details
            const currentTestimonial = (await Testimonial.getTestimonialById(testimonialId))[0];
    
            // Debugging output
            console.log('Current Testimonial:', currentTestimonial);
            
            // Check if a new image is uploaded
            const testimonialImage = req.files && req.files["testi_image"] ? req.files["testi_image"][0].filename : null;
    
            // Debugging output
            console.log('New testimonialImage:', testimonialImage);
    
            // Handle image replacement
            if (testimonialImage) {
                // If there is an old image, delete it
                if (currentTestimonial.testi_image) {
                    const oldImagePath = path.join(__dirname, '../../uploads/', currentTestimonial.testi_image);
                    
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
                testimonialData.testi_image = testimonialImage;
            } else {
                // If no new image is uploaded, retain the old image
                testimonialData.testi_image = currentTestimonial.testi_image;
            }

    
            // Update the testimonial in the database
            await Testimonial.updateTestimonial(testimonialId, testimonialData);
    
            // Respond with success
            res.json({
                status: 1,
                message: 'Testimonial updated successfully!',
                redirect_url: '/admin/testimonials-list'
            });
        } catch (error) {
            console.error('Failed to update testimonial:', error);
            res.status(500).json({
                status: 0,
                message: 'Failed to update testimonial'
            });
        }
    }
    
    async deleteTestimonial(req, res) {
        const testimonialId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentTestimonial = (await Testimonial.getTestimonialById(testimonialId))[0]; // Fetch current rider details
            if (!currentTestimonial) {
                return this.sendError(res, 'Testimonial not found');
            }

            const testimonialImage = currentTestimonial.testi_image; // Get the image filename
            console.log('Testimonial to delete:', currentTestimonial); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (testimonialImage) {
                const imagePath = path.join(__dirname, '../../uploads/', testimonialImage);
                console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                    console.log('Image found. Deleting now...');
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error('Error deleting rider image:', err); // Log the error if deletion fails
                        } else {
                            console.log('Testimonial image deleted successfully');
                        }
                    });
                } else {
                    console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
                }
            }

            // Step 3: Delete the rider from the database
            const result = await Testimonial.deleteTestimonialById(testimonialId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Testimonial deleted successfully!',
                    redirect_url: '/admin/testimonials-list'
                });            } else {
                this.sendError(res, 'Failed to delete rider');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting testimonial.',
                error: error.message
            });
        }
    }
    
}



module.exports = TestimonialController;
