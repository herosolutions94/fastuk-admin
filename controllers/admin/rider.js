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

    renderCreateDocumentForm(req, res) {
        const { rider_id } = req.params;
        res.render('admin/add-document-request', { rider_id }); // Render your form view
    }

    async createDocumentRequest(req, res) {
        try {
            const { rider_id } = req.params; // Get rider ID from params
            const { title, description } = req.body; // Get form data

            if (!title || !description) {
                return res.status(200).json({ error: 'Title and Description are required' });
            }

            // Insert document request into the database
            await Rider.create({
                rider_id,
                title,
                description,
            });

            // Redirect to the documents page after successful submission
            this.sendSuccess(res, {}, 'Document Request created successfully!', 200, `/admin/riders/documents/${rider_id}`)

        } catch (error) {
            console.error('Error creating document request:', error);
            res.status(200).json({ error: 'Failed to create document request' });
        }
    }


    async getRiderDocuments(req, res) {
        try {
            console.log("Request Params:", req.params); 

            const { rider_id } = req.params; 
            if (!rider_id) {
                return res.status(200).send("Rider ID is required.");
            }
    
            const documents = await Rider.getDocuments(rider_id);
            res.render('admin/documents', { documents, rider_id }); 
        } catch (error) {
            console.error('Error fetching rider documents:', error);
            res.status(200).json({ error: 'Failed to fetch documents' });
        }
    }

    async renderEditDocumentForm(req, res) {
        try {
            const { rider_id, document_id } = req.params;
            console.log("rider_id:",rider_id,"document_id:",document_id)
    
            // Fetch document details
            const document = await Rider.getDocumentById(document_id);
    
            if (!document) {
                return res.status(200).send('Document not found');
            }
    
            res.render('admin/edit-document', { rider_id, document });
        } catch (error) {
            console.error('Error fetching document for edit:', error);
            res.status(200).json({ error: 'Failed to load document for editing' });
        }
    }

    async updateDocument(req, res) {
        try {
            const { rider_id, document_id } = req.params;
            const { title, description } = req.body;
    
            if (!title || !description) {
                return res.status(200).json({ error: 'Title and Description are required' });
            }
    
            await Rider.updateDocument(document_id, title, description);
    
            this.sendSuccess(res, {}, 'Document updated successfully!', 200, `/admin/riders/documents/${rider_id}`);
        } catch (error) {
            console.error('Error updating document:', error);
            res.status(200).json({ error: 'Failed to update document' });
        }
    }

    async deleteDocument(req, res) {
        try {
            const { rider_id, document_id } = req.params;
    
            await Rider.deleteDocument(document_id);
    
            this.sendSuccess(res, {}, 'Document deleted successfully!', 200, `/admin/riders/documents/${rider_id}`);
        } catch (error) {
            console.error('Error deleting document:', error);
            res.status(200).json({ error: 'Failed to delete document' });
        }
    }
    
    
    
    
    
    
    
    

}


module.exports = new RiderController();
