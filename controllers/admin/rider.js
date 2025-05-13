const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const Rider = require('../../models/rider');
const RiderModel = require('../../models/riderModel');
const BaseController = require('../baseController');
const helpers = require('../../utils/helpers');

class RiderController extends BaseController {
    // Method to get the riders and render them in the view

    constructor() {
        super();
        this.riderModel = new RiderModel();
    }

    async getRiders(req, res) {
        try {
            const riders = await Rider.getAllRiders();
    
            
    
            // Fetch earnings sequentially for each rider
            for (let rider of riders) {
                const earningsData = await this.riderModel.getRiderEarnings(rider.id);
                rider.available_balance = earningsData.availableBalance; // Add balance field to each rider
            }
    
            // Render with updated riders' data
            res.render('admin/riders/dashboard', { riders });
    
        } catch (error) {
            console.error('Error fetching riders:', error);
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
            // console.log('Fetched rider:', rider); // Log fetched rider data

            // console.log('Rider data before rendering:', rider); // Log the rider data

    
            // Check if rider exists
            if (rider) {
                const attachments = await Rider.getRiderAttachments(riderId); // Add this method in your model
              // Organize attachments by type for easier access in EJS
              const attachmentMap = {};
              let pictures=[];
              attachments.forEach((att) => {
                
                if(att?.type==='pictures'){
                    pictures.push(att.filename);
                }
                else{
                    attachmentMap[att.type] = att.filename;
                }
                
              });
              attachmentMap['pictures']=pictures;
              console.log("attachmentMap:",attachmentMap)
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/riders/edit-rider', { 
                    rider, 
                    editRiderId: riderId, 
                    imageFilenames: [rider.driving_license], // Make sure to access the rider image correctly
                    status: rider.status,
                    attachments: attachmentMap,
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
        const riderData = req.body;

        const currentRider = (await Rider.getRiderById(riderId))[0];
        const currentAttachments = await Rider.getRiderAttachments(riderId); // Fetch existing attachments

        // Helper: update a single image file (delete old if replaced)
        const handleSingleAttachment = async (fieldName) => {
  const newFile = req.files?.[fieldName]?.[0]?.filename;

  // Find the old file from attachments where type = fieldName
  const oldAttachment = currentAttachments.find(att => att.type === fieldName);
  const oldFile = oldAttachment?.filename;

  if (newFile && oldFile) {
    const oldFilePath = path.join(__dirname, '../../uploads/', oldFile);
    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
  }

  return newFile || oldFile || null;
};


        // Helper: handle multiple images like front/back/side
        const handleMultipleAttachments = async () => {
  const newFiles = req.files?.["pictures"]?.map(f => f.filename) || [];

  const oldPictures = currentAttachments
    .filter(att => att.type === 'pictures')
    .map(att => att.filename);

  if (newFiles.length > 0 && oldPictures.length > 0) {
    oldPictures.forEach(file => {
      const filePath = path.join(__dirname, '../../uploads/', file);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  }

  return newFiles.length > 0 ? newFiles : oldPictures;
};


        // Attachments to update
        const updatedAttachments = {
            address_proof: await handleSingleAttachment("address_proof"),
            self_picture: await handleSingleAttachment("self_picture"),
            passport_pic: await handleSingleAttachment("passport_pic"),
            national_insurance: await handleSingleAttachment("national_insurance"),
            company_certificate: await handleSingleAttachment("company_certificate"),
            pictures: await handleMultipleAttachments()
        };

        // Update rider info
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


        await Rider.updateRider(riderId, riderData);
        await Rider.updateRiderAttachments(riderId, updatedAttachments); // new function for attachments

        this.sendSuccess(res, {}, 'Updated Successfully!', 200, '/admin/riders');

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

            // const riderImage = currentRider.driving_license; // Get the image filename
            // console.log('Rider to delete:', currentRider); // Log rider details for debugging

            // // Step 2: Check if the rider has an associated image
            // if (riderImage) {
            //     const imagePath = path.join(__dirname, '../../uploads/', riderImage);
            //     console.log('Image Path:', imagePath); // Log the image path

            //     // Check if the image file exists before trying to delete
            //     if (fs.existsSync(imagePath)) {
            //         console.log('Image found. Deleting now...');
            //         fs.unlink(imagePath, (err) => {
            //             if (err) {
            //                 console.error('Error deleting rider image:', err); // Log the error if deletion fails
            //             } else {
            //                 console.log('Rider image deleted successfully');
            //             }
            //         });
            //     } else {
            //         console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
            //     }
            // }

            // Step 3: Delete the rider from the database
            const result = await this.riderModel.updateRiderData(riderId,{
                is_deleted:1,
                deleted_at:helpers.getUtcTimeInSeconds()
            });
            this.sendSuccess(res, {}, 'Rider deleted successfully!', 200, '/admin/riders')
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

            // Prepare notification for the rider
        const notificationText = `You have a new document request: ${title}`;
        const link = `/rider-dashboard/documents`; // Link to the documents page

        // Send notification to the rider
        await helpers.storeNotification(rider_id, 'rider', 0, notificationText, link);

        const userRow = await this.riderModel.findById(rider_id);
        let adminData = res.locals.adminData; 
            const result=await helpers.sendEmail(
              userRow.email,
              `Document Submission Request from ${adminData?.site_name}`,
              "document-request",
              {
                username:userRow?.full_name,
                adminData,
                title:title,
                description:description
              }
            );

            // Redirect to the documents page after successful submission
            this.sendSuccess(res, {}, 'Document Request created successfully!', 200, `/admin/riders/documents/${rider_id}`)

        } catch (error) {
            console.error('Error creating document request:', error);
            res.status(200).json({ error: 'Failed to create document request' });
        }
    }


    async getRiderDocuments(req, res) {
        try {
            // console.log("Request Params:", req.params); 

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

    async updateDocumentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.query;  // ✅ Read from query parameters
    
            if (!id || !status) {
                return res.status(400).json({ status: 0, msg: "Missing parameters." });
            }
    
            await Rider.updateDocumentStatus(id, status);
    
            // Fetch updated document details
            const updatedDoc = await Rider.getDocumentById(id);
            const userRow = await this.riderModel.findById(updatedDoc.rider_id);
            let adminData = res.locals.adminData; 
            const result=await helpers.sendEmail(
              userRow.email,
              `Your Document Has Been ${status} from ${adminData?.site_name}`,
              "document-request-status",
              {
                username:userRow?.full_name,
                adminData,
                title:updatedDoc?.title,
                description:updatedDoc?.description,
                status:status
              }
            );
            if (updatedDoc) {
                return res.redirect(`/admin/riders/documents/${updatedDoc.rider_id}`);
            } else {
                return this.sendError(res, "Failed to update document status");
            }
        } catch (error) {
            console.error("Error updating document status:", error);
            return res.status(500).json({ status: 0, msg: "Internal server error." });
        }
    }

    async handleRiderApprove(req, res) {
        try {
            console.log("req.params:", req.params);
            console.log("req.query:", req.query);
    
            const { id } = req.params;
            const { is_approved } = req.query;  
    
            // Ensure ID and is_approved are present
            if (!id || !is_approved) {
                return res.status(400).json({ status: 0, msg: "Missing parameters." });
            }
    
            // Check if is_approved is a valid enum value
            const validStatuses = ["pending", "approved", "rejected"];
            if (!validStatuses.includes(is_approved)) {
                return res.status(200).json({ status: 0, msg: "Invalid approval status." });
            }
    
            // Update business user status in the database
            await Rider.updateRiderApprove(id, is_approved);
    
            // Fetch the updated user
            const updatedRider = await Rider.findById(id);
            console.log("Updated Rider:", updatedRider);

            let adminData = res.locals.adminData;
        let subject, templateName;

        if (is_approved === "approved") {
            subject = "Congratulations! Your Rider Account is Approved - " + adminData.site_name;
            templateName = "approval-email";
        } else if (is_approved === "rejected") {
            subject = "Rider Application Rejected - " + adminData.site_name;
            templateName = "rejection-email";
        }

        // Prepare template data
        const templateData = {
            username: updatedRider.full_name,
            adminData
        };

        // Send the email if status is approved or rejected
        if (is_approved !== "pending") {
            await helpers.sendEmail(updatedRider.email, subject, templateName, templateData);
        }            
    
            if (updatedRider) {
                return res.redirect('/admin/riders');
            } else {
                return res.status(200).json({ status: 0, msg: "Failed to approve rider." });
            }
        } catch (error) {
            console.error("Error approving rider:", error);
            return res.status(200).json({ status: 0, msg: "Internal server error." });
        }
    }
    
    
    
    
    
    
    
    
    

}


module.exports = new RiderController();
