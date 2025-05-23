const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BusinessUser = require('../../models/member');
const MemberModel = require('../../models/memberModel');
const BaseController = require('../baseController');
const helpers = require('../../utils/helpers');
const Addresses = require("../../models/api/addressModel");

class BusinessUserController extends BaseController {

    constructor() {
        super();
        this.memberModel = new MemberModel();
        this.addressModel = new Addresses();
        
    }
    // Method to get the riders and render them in the view
    async getBusinessUsers(req, res) {
        try {
            const businessUsers = await BusinessUser.getAllMembers([{ field: 'mem_type', operator: '=', value: 'business' }]);
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            res.render('admin/business_users/dashboard', { businessUsers: businessUsers || [] });
        } catch (error) {
            console.error('Error fetching business-users:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch business-users');
        }
    }
    // Method to fetch a single rider by id and render the edit form
    async editBusinessUser(req, res) {
        try {
            const businessUserId = req.params.id;  // Get the rider ID from the request parameters
            console.log('Fetching business-user with ID:', businessUserId); // Log the ID
    
            // Fetch the rider by ID
            const businessUser = (await BusinessUser.getMemberById(businessUserId))[0]; // Extract the first rider if it's returned as an array
            console.log('Fetched business-user:', businessUser); // Log fetched rider data

            console.log('business-user data before rendering:', businessUser); // Log the rider data
            const addresses = await this.addressModel.getAddressesByUserId(businessUserId);
    
            // Check if rider exists
            if (businessUser) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/business_users/edit-business-user', { 
                    businessUser, 
                    editBusinessUserId: businessUserId, 
                    addresses:addresses,
                    imageFilenames: [businessUser.mem_image], // Make sure to access the rider image correctly
                    status: businessUser.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'business-user not found');
            }
        } catch (error) {
            console.error('Error fetching business-user:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch business-user');
        }
    }
    

    // Method to handle updating rider information
    async updateBusinessUser(req, res) {
        try {
            const businessUserId = req.params.id;
            const businessUserData = req.body; // Get the updated data from the form
    
            // Fetch the current rider details, including the current image
            const currentBusinessUser = (await BusinessUser.getMemberById(businessUserId))[0];
            
            // If a new image is uploaded
            const businessUserImage = req.files && req.files["mem_image"] ? req.files["mem_image"][0].filename : null;
            console.log('New mem_image:', businessUserImage);
    
            // Check if there's an old image to delete
            if (businessUserImage && currentBusinessUser.mem_image) {
                const oldImagePath = path.join(__dirname, '../../uploads/', currentBusinessUser.mem_image);
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
            if (businessUserImage) {
                businessUserData.mem_image = businessUserImage;
            } else {
                // If no new image is uploaded, retain the old image
                businessUserData.mem_image = currentBusinessUser.mem_image;
            }
    
            // Update the rider in the database
            await BusinessUser.updateMember(businessUserId, businessUserData);
    
            // Redirect to the riders list with a success message
            this.sendSuccess(res, {}, 'Updated Successfully!', 200, '/admin/business-users')
        } catch (error) {
            console.error('Failed to update business-user:', error);
            this.sendError(res, 'Failed to update business-user');
        }
    }

    async deleteBusinessUser(req, res) {
        const businessUserId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentBusinessUser = (await BusinessUser.deleteMemberById(businessUserId))[0]; // Fetch current rider details
            if (!currentBusinessUser) {
                return this.sendError(res, 'business-user not found');
            }

            const businessUserImage = currentBusinessUser.mem_image; // Get the image filename
            console.log('business-user to delete:', currentBusinessUser); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (businessUserImage) {
                const imagePath = path.join(__dirname, '../../uploads/', businessUserImage);
                console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                    console.log('Image found. Deleting now...');
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error('Error deleting business-user image:', err); // Log the error if deletion fails
                        } else {
                            console.log('business-user image deleted successfully');
                        }
                    });
                } else {
                    console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
                }
            }

            // Step 3: Delete the rider from the database
            const result = await BusinessUser.deleteMemberById(businessUserId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Rider deleted successfully!', 200, '/admin/business-users')

            } else {
                this.sendError(res, 'Failed to delete business-user');
            }
        } catch (error) {
            console.error('Error deleting business-user:', error);
            this.sendError(res, 'Failed to delete business-user');
        }

    }

    async handleBusinessUserApprove(req, res) { 
        try {
            console.log("req.params:", req.params);
            console.log("req.query:", req.query);
    
            const { id } = req.params;
            const { is_approved } = req.query;  
    
            if (!id || !is_approved) {
                return res.status(200).json({ status: 0, msg: "Missing parameters." });
            }
    
            const validStatuses = ["pending", "approved", "rejected"];
            if (!validStatuses.includes(is_approved)) {
                return res.status(200).json({ status: 0, msg: "Invalid approval status." });
            }
    
            await BusinessUser.updateBusinessUserApprove(id, is_approved);
    
            const updatedBusinessUser = await BusinessUser.findById(id);
            console.log("Updated User:", updatedBusinessUser);

            let adminData = res.locals.adminData;
                    let subject, templateName;
            
                    if (is_approved === "approved") {
                        subject = "Congratulations! Your Business Account is Approved - " + adminData.site_name;
                        templateName = "approval-email";
                    } else if (is_approved === "rejected") {
                        subject = "Business Application Rejected - " + adminData.site_name;
                        templateName = "rejection-email";
                    }
            
                    // Prepare template data
                    const templateData = {
                        username: updatedBusinessUser.full_name,
                        adminData
                    };
            
                    // Send the email if status is approved or rejected
                    if (is_approved !== "pending") {
                        await helpers.sendEmail(updatedBusinessUser.email, subject, templateName, templateData);
                    }     
    
            if (updatedBusinessUser) {
                // If approved, update credits and deactivate the account
                if (is_approved === "approved") {
                    await this.memberModel.updateMemberData(id, { total_credits: 200 });
                }
    
                return res.redirect('/admin/business-users');
            } else {
                return res.status(200).json({ status: 0, msg: "Failed to update business user status." });
            }
        } catch (error) {
            console.error("Error approving business user:", error);
            return res.status(200).json({ status: 0, msg: "Internal server error." });
        }
    }
    
    
    
    

    
    
    
    
    
    
    
    
    

}


module.exports = new BusinessUserController();
