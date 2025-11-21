const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const Member = require('../../models/member');
const BaseController = require('../baseController');
const helpers = require("../../utils/helpers");
const Addresses = require("../../models/api/addressModel");

class MemberController extends BaseController {
    constructor() {
        super();
        this.addressModel = new Addresses();

    }

    // Method to get the riders and render them in the view
    async getMembers(req, res) {
        try {
            const members = await Member.getAllMembers([{ field: 'mem_type', operator: '=', value: 'user' }, { field: 'is_deleted', operator: '!=', value: 1 }]);
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            // if (members && members.length > 0) {
            // Corrected res.render with only two arguments
            res.render('admin/members/index', { members: members || [] });
            // } else {
            //     this.sendError(res, 'No members found');
            // }
        } catch (error) {
            console.error('Error fetching members:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch members');
        }
    }
    // Method to fetch a single rider by id and render the edit form
    async editMember(req, res) {
        try {
            const memberId = req.params.id;  // Get the rider ID from the request parameters

            // console.log('Fetching member with ID:', memberId); // Log the ID

            const members = await Member.getMemberById(memberId); // Expecting an array from the model
            const member = members[0]; // Get the first member if it exists
            const states = await Member.getStatesByCountryId(230); // Fetch states for country_id = 230
            const addresses = await this.addressModel.getAddressesByUserId(memberId);
            // console.log('Member:', addresses); // Log the rider data

            if (member && member.mem_image) {

                const imageName = member.mem_image; // or req.file.filename if using multer
                const sourceDir = path.join(__dirname, "../../uploads");
                const thumbFolder = "thumbnails";
                const width = 300;
                const height = 300;


                try {
                    const thumbPath = await helpers.generateThumbnail(imageName, sourceDir, thumbFolder, width, height);
                    console.log('✅ Thumbnail generated successfully at:', thumbPath);
                } catch (thumbErr) {
                    console.error('⚠️ Failed to generate thumbnail:', thumbErr.message);
                }
            } else {
                console.log('⚠️ No image found for this user.');
            }

            if (member) {
                res.render('admin/members/edit-member', {
                    member, editMemberId: memberId, states, addresses,
                    imageFilenames: [member.mem_image],
                    mem_status: member.mem_status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Member not found');
            }
        } catch (error) {
            console.log(error)
            this.sendError(res, 'Failed to fetch rider');
        }
    }

    // Method to handle updating rider information
    async updateMember(req, res) {
        try {
            const memberData = req.body; // Get the updated data from the form
            const memberId = req.params.id;

            const currentMember = (await Member.getMemberById(memberId))[0]; // Fetch current rider details

            // If a new image is uploaded
            const memberImage = req.files["mem_image"] ? req.files["mem_image"][0].filename : null;
            // console.log('New memberImage:', memberImage); // Debugging to confirm the new image value

            // Define paths
            const uploadsDir = path.join(__dirname, '../../uploads');
            const thumbsDir = path.join(uploadsDir, 'thumbnails');

            // Check if there's an old image to delete
            if (memberImage && currentMember.mem_image) {
                const oldImagePath = path.join(uploadsDir, currentMember.mem_image);
                const oldThumbPath = path.join(thumbsDir, currentMember.mem_image);                // console.log('Old Image Path:', oldImagePath); // Log the old image path

                // Check if the old image file exists before trying to delete
                 // Delete main image if exists
            if (fs.existsSync(oldImagePath)) {
                console.log('Deleting old image:', oldImagePath);
                fs.unlinkSync(oldImagePath);
                console.log('Old main image deleted successfully');
            } else {
                console.log('Old image not found:', oldImagePath);
            }

            // Delete thumbnail if exists
            if (fs.existsSync(oldThumbPath)) {
                console.log('Deleting old thumbnail:', oldThumbPath);
                fs.unlinkSync(oldThumbPath);
                console.log('Old thumbnail deleted successfully');
            } else {
                console.log('Old thumbnail not found:', oldThumbPath);
            }
            }
            // If a new image is uploaded, update rider data with the new image filename
            if (memberImage) {
                memberData.mem_image = memberImage;
            } else {
                // If no new image is uploaded, retain the old image
                memberData.mem_image = currentMember.mem_image;
            }

            // If a new image is uploaded, generate a thumbnail
            if (memberImage) {
                const sourceDir = path.join(__dirname, '../../uploads');
                const thumbFolder = 'thumbnails';
                const width = 300;
                const height = 300;

                // ✅ Generate the thumbnail using your helper
                await helpers.generateThumbnail(memberImage, sourceDir, thumbFolder, width, height);
                console.log('Thumbnail created for:', memberImage);

                // Update with new image
                memberData.mem_image = memberImage;
            } else {
                // Retain old image
                memberData.mem_image = currentMember.mem_image;
            }

            // Update the rider in the database
            await Member.updateMember(memberId, memberData);

            // Redirect to the riders list with a success message
            this.sendSuccess(res, {}, 'Updated Successfully!', 200, '/admin/members')
        } catch (error) {
            console.error('Failed to update member:', error);
            this.sendError(res, 'Failed to update member');
        }
    }

    async deleteMember(req, res) {
        const memberId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentMember = (await Member.getMemberById(memberId))[0]; // Fetch current rider details
            if (!currentMember) {
                return this.sendError(res, 'Member not found');
            }

            const memberImage = currentMember.mem_image; // Get the image filename
            // console.log('Member to delete:', currentMember); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (memberImage) {
                const uploadsDir = path.join(__dirname, '../../uploads');
                const imagePath = path.join(uploadsDir, businessUserImage);
                 const thumbPath = path.join(uploadsDir, 'thumbnails', businessUserImage);
                // console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                console.log('Deleting main image:', imagePath);
                fs.unlinkSync(imagePath);
                console.log('Main image deleted successfully');
            } else {
                console.log('Main image not found:', imagePath);
            }

            // Delete thumbnail image
            if (fs.existsSync(thumbPath)) {
                console.log('Deleting thumbnail image:', thumbPath);
                fs.unlinkSync(thumbPath);
                console.log('Thumbnail image deleted successfully');
            } else {
                console.log('Thumbnail not found:', thumbPath);
            }
            }

            // Step 3: Delete the rider from the database
            const result = await Member.updateMemberData(memberId, {
                is_deleted: 1,
                deleted_at: helpers.getUtcTimeInSeconds()
            });
            this.sendSuccess(res, {}, 'Member deleted successfully!', 200, '/admin/members')
        } catch (error) {
            console.error('Error deleting member:', error);
            this.sendError(res, 'Failed to delete member');
        }
    }

    // Fetch states by country_id
    // async getStates(req, res) {
    //     const { country_id } = req.query; // Retrieve country_id from query parameters
    //     try {
    //         const states = await Member.getStatesByCountryId(230);
    //         if (states && states.length > 0) {
    //             this.sendSuccess(res, states, 'States fetched successfully!');
    //         } else {
    //             this.sendError(res, 'No states found for the selected country.');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching states:', error);
    //         this.sendError(res, 'Failed to fetch states.');
    //     }
    // }

    // async getStates(req, res) {
    //     try {
    //         const memberId = req.params.id; // Get the member ID from the URL
    //         const member = await Member.getMemberById(memberId); // Fetch member details
    //         const states = await Member.getStatesByCountryId(230); // Fetch states for country_id = 230
    //         res.render('admin/members/edit-member', { member, states }); // Pass data to EJS
    //     } catch (error) {
    //         console.error('Error rendering edit member form:', error);
    //         this.sendError(res, 'Failed to render edit member form');
    //     }
    // }


}


module.exports = new MemberController();
