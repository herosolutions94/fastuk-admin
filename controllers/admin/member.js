const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const Member = require('../../models/member');
const BaseController = require('../baseController');

class MemberController extends BaseController {
    // Method to get the riders and render them in the view
    async getMembers(req, res) {
        try {
            const members = await Member.getAllMembers();
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

            // console.log('Member:', member); // Log the rider data

            if (member) {
                res.render('admin/members/edit-member', {
                    member, editMemberId: memberId, states,
                    imageFilenames: [member.mem_image],
                    mem_status: member.mem_status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Member not found');
            }
        } catch (error) {
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

            // Check if there's an old image to delete
            if (memberImage && currentMember.mem_image) {
                const oldImagePath = path.join(__dirname, '../../uploads/', currentMember.mem_image);
                // console.log('Old Image Path:', oldImagePath); // Log the old image path

                // Check if the old image file exists before trying to delete
                if (fs.existsSync(oldImagePath)) {
                    console.log('Old image found. Deleting now...');
                    fs.unlink(oldImagePath, (err) => {
                        if (err) {
                            console.error('Error deleting old image:', err); // Log the error if deletion fails
                        } else {
                            console.log('Old image deleted successfully');
                        }
                    });
                } else {
                    console.log('Old image file not found:', oldImagePath); // Log if the image doesn't exist
                }
            }
            // If a new image is uploaded, update rider data with the new image filename
            if (memberImage) {
                memberData.mem_image = memberImage;
            }else {
                // If no new image is uploaded, retain the old image
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
                const imagePath = path.join(__dirname, '../../uploads/', memberImage);
                // console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                    // console.log('Image found. Deleting now...');
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
            const result = await Member.deleteMemberById(memberId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Member deleted successfully!', 200, '/admin/members')

            } else {
                this.sendError(res, 'Failed to delete memberr');
            }
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
