// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Team = require('../../models/team');
const { validateRequiredFields } = require('../../utils/validators');


class TeamController extends BaseController {
    constructor() {
        super();
        this.team = new Team();
    }

    renderAddTeamPage(req, res) {
        try {
            res.render('admin/add-team-member'); // Render the add-testimonial.ejs file
        } catch (error) {
            console.error('Error rendering add team page:', error);
            return this.sendError(res, 'Failed to load add team page');
        }
    }

    async addTeamMember(req, res) {

        try {
            const {
                title,
                designation,
                status,
            } = req.body;
            console.log("req.body",req.body);  // To check if name and description are being sent

            const teamMemberImage = req.files && req.files["team_mem_image"] ? req.files["team_mem_image"][0].filename : '';
            console.log("req.file:",req.file);  // To check if the file is being uploaded


            // Clean and trim data
            const cleanedData = {
                title: typeof title === 'string' ? title.trim() : '',
                designation: typeof designation === 'string' ? designation.trim() : '',
                team_mem_image: teamMemberImage,  // Change this to match your DB column name
                status: status || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }

            const existingTeamMember = await Team.findByTitle(title);
        
            if (existingTeamMember) {
                return res.status(400).json({ message: 'Team member already exists' });
            }
            // Create the rider
            const teamMemId = await this.team.createTeamMember(cleanedData);
            console.log('Created team member ID:', teamMemId); // Log the created rider ID


        const createdTeamMember = await this.team.findById(teamMemId);
        console.log('Created team:', createdTeamMember); // Log the created rider


        res.json({
            status: 1,
            message: 'Team Member added successfully!',
            redirect_url: '/admin/team-members-list'
        });        
    } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while adding team member.',
                error: error.message
            });
        }
    ;
    }
    async getTeamMembers(req, res) {
        try {
            const teamMembers = await Team.getAllTeamMembers();
            // console.log('Fetched Riders:', riders); // Log the fetched riders

            if (teamMembers && teamMembers.length > 0) {
                // Corrected res.render with only two arguments
                res.render('admin/team-members', { teamMembers: teamMembers || [] });
            } else {
                this.sendError(res, 'No team members found');
            }
        } catch (error) {
            console.error('Error fetching team members:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch team members');
        }
    }

    async editTeamMember(req, res) {
        try {
            const teamMemId = req.params.id;  // Get the rider ID from the request parameters
            console.log('Fetching team member with ID:', teamMemId); // Log the ID
    
            // Fetch the rider by ID
            const teamMember = (await Team.getTeamMemberById(teamMemId))[0]; // Extract the first rider if it's returned as an array
            console.log('Fetched team member:', teamMember); // Log fetched rider data

            console.log('team member data before rendering:', teamMember); // Log the rider data

    
            // Check if rider exists
            if (teamMember) {
                // Assuming `result` is defined properly, or you should use rider.rider_image
                res.render('admin/edit-team-member', {
                    teamMember, 
                    editTeamMemberId: teamMemId, 
                    imageFilenames: [teamMember.team_mem_image], // Make sure to access the rider image correctly
                    status: teamMember.status // Pass the status to the view

                });
            } else {
                this.sendError(res, 'Team member not found');
            }
        } catch (error) {
            console.error('Error fetching team member:', error); // Log the error for debugging
            this.sendError(res, 'Failed to fetch team member');
        }
    }

    async updateTeamMember(req, res) {
        try {
            const teamMemId = req.params.id;
            const teamMemberData = req.body;
    
            // Fetch the current team member details
            const currentTeamMember = (await Team.getTeamMemberById(teamMemId))[0];
    
            // Debugging output
            console.log('Current team member:', currentTeamMember);
    
            // Check if a new image is uploaded
            const teamMemberImage = req.files && req.files["team_mem_image"] ? req.files["team_mem_image"][0].filename : null;
    
            // Debugging output
            console.log('New team member image:', teamMemberImage);
    
            // If a new image is uploaded, handle it
            if (teamMemberImage) {
                // If there is an old image, delete it
                if (currentTeamMember.team_mem_image) {
                    const oldImagePath = path.join(__dirname, '../../uploads/', currentTeamMember.team_mem_image);
    
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
                // Update the team member data with the new image filename
                teamMemberData.team_mem_image = teamMemberImage;
            } else {
                // If no new image is uploaded, retain the old image
                teamMemberData.team_mem_image = currentTeamMember.team_mem_image; // Keep the old image
            }
    
            // Update the team member in the database
            await Team.updateTeamMember(teamMemId, teamMemberData);
    
            // Respond with success
            res.json({
                status: 1,
                message: 'Team member updated successfully!',
                redirect_url: '/admin/team-members-list'
            });
        } catch (error) {
            console.error('Failed to update team member:', error);
            res.status(500).json({
                status: 0,
                message: 'Failed to update team member'
            });
        }
    }
    
    
    async deleteTeamMember(req, res) {
        const teamMemId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentTeamMember = (await Team.getTeamMemberById(teamMemId))[0]; // Fetch current rider details
            if (!currentTeamMember) {
                return this.sendError(res, 'Team member not found');
            }

            const teamMemberImage = currentTeamMember.team_mem_image; // Get the image filename
            console.log('Team member to delete:', currentTeamMember); // Log rider details for debugging

            // Step 2: Check if the rider has an associated image
            if (teamMemberImage) {
                const imagePath = path.join(__dirname, '../../uploads/', teamMemberImage);
                console.log('Image Path:', imagePath); // Log the image path

                // Check if the image file exists before trying to delete
                if (fs.existsSync(imagePath)) {
                    console.log('Image found. Deleting now...');
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error('Error deleting rider image:', err); // Log the error if deletion fails
                        } else {
                            console.log('Team member image deleted successfully');
                        }
                    });
                } else {
                    console.log('Image file not found:', imagePath); // Log if the image file doesn't exist
                }
            }

            // Step 3: Delete the rider from the database
            const result = await Team.deleteTeamMemberById(teamMemId);
            if (result) {
                // Redirect to the riders list after deletion
                this.sendSuccess(res, {}, 'Team Member deleted successfully!', 200, '/admin/team-members-list')

                // res.json({
                //     status: 1,
                //     message: 'Team Member deleted successfully!',
                //     redirect_url: '/admin/team-members-list'
                // });            
                } else {
                this.sendError(res, 'Failed to delete team member');
            }
        } catch (error) {
            console.error('Failed to delete member:', error);
            this.sendError(res, 'Failed to delete member');
            // return res.status(200).json({ // Changed to status 500 for server errors
            //     status: 0,
            //     message: 'An error occurred while deleting team member.',
            //     error: error.message
            // });
        }
    }

    
}



module.exports = TeamController;
