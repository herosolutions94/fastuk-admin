const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const Rider = require('../../models/rider');
const BaseController = require('../baseController');

class RiderController extends BaseController {
    // Method to get the riders and render them in the view
    async getRiders(req, res) {
        try {
            const riders = await Rider.getAllRiders();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            if (riders && riders.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/riders/dashboard', { riders: riders || [] });
            } else {
                this.sendError(res, 'No riders found');
            }
        } catch (error) {
            console.error('Error fetching riders:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch riders');
        }
    }
    // Method to fetch a single rider by id and render the edit form
    async editRider(req, res) {
        try {
            const riderId = req.params.id;  // Get the rider ID from the request parameters
            console.log('Fetching rider with ID:', riderId); // Log the ID
    
            // Fetch the rider by ID
            const rider = (await Rider.getRiderById(riderId))[0]; // Extract the first rider if it's returned as an array
            console.log('Fetched rider:', rider); // Log fetched rider data

            console.log('Rider data before rendering:', rider); // Log the rider data

    
            // Check if rider exists
            if (rider) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/riders/edit-rider', { 
                    rider, 
                    editRiderId: riderId, 
                    imageFilenames: [rider.driving_license], // Make sure to access the rider image correctly
                    status: rider.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Rider not found');
            }
        } catch (error) {
            console.error('Error fetching rider:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch rider');
        }
    }
    

    // Method to handle updating rider information
    async updateRider(req, res) {
        try {
            const riderId = req.params.id;
            const riderData = req.body; // Get the updated data from the form
    
            // Fetch the current rider details, including the current image
            const currentRider = (await Rider.getRiderById(riderId))[0];
            
            // If a new image is uploaded
            const drivingLicense = req.files && req.files["driving_license"] ? req.files["driving_license"][0].filename : null;
            console.log('New riderDrivingLicense:', drivingLicense);
    
            // Check if there's an old image to delete
            if (drivingLicense && currentRider.driving_license) {
                const oldImagePath = path.join(__dirname, '../../uploads/', currentRider.driving_license);
                console.log('Old Image Path:', oldImagePath);
    
                // Check if the old image file exists before trying to delete
                if (fs.existsSync(oldImagePath)) {
                    console.log('Old image found. Deleting now...');
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
    
            // If a new image is uploaded, update rider data with the new image filename
            if (drivingLicense) {
                riderData.driving_license = drivingLicense;
            } else {
                // If no new image is uploaded, retain the old image
                riderData.driving_license = currentRider.driving_license;
            }
    
            // Update the rider in the database
            await Rider.updateRider(riderId, riderData);
    
            // Redirect to the riders list with a success message
            this.sendSuccess(res, {}, 'Updated Successfully!', 200, '/admin/riders')
        } catch (error) {
            console.error('Failed to update rider:', error);
            this.sendError(res, 'Failed to update rider');
        }
    }

    async deleteRider(req, res) {
        const riderId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentRider = (await Rider.getRiderById(riderId))[0]; // Fetch current rider details
            if (!currentRider) {
                return this.sendError(res, 'Rider not found');
            }

            const riderImage = currentRider.driving_license; // Get the image filename
            console.log('Rider to delete:', currentRider); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (riderImage) {
                const imagePath = path.join(__dirname, '../../uploads/', riderImage);
                console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                    console.log('Image found. Deleting now...');
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error('Error deleting rider image:', err); // Log the error if deletion fails
                        } else {
                            console.log('Rider image deleted successfully');
                        }
                    });
                } else {
                    console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
                }
            }

            // Step 3: Delete the rider from the database
            const result = await Rider.deleteRiderById(riderId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Rider deleted successfully!', 200, '/admin/riders')

            } else {
                this.sendError(res, 'Failed to delete rider');
            }
        } catch (error) {
            console.error('Error deleting rider:', error);
            this.sendError(res, 'Failed to delete rider');
        }
    }
    

}


module.exports = new RiderController();
