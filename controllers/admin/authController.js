const BaseController = require('../baseController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/authModel'); // Assuming you have an admin model for database interaction
const { validateRequiredFields } = require('../../utils/validators');

class AdminController extends BaseController {
    constructor() {
        super(); // Initialize BaseController
        this.admin = Admin;
    }



    // Render the login page
    renderLoginPage(req, res) {
        const message = req.session.message || null;  // Retrieve flash message
        delete req.session.message;  // Clear message after it's been shown
        res.render('admin/login', { message, layout: 'admin/login-layout' });
    }

    async login(req, res) {
        try {
            // console.log(req.body)
            const { user_name, password } = req.body;

            // Validate email and password presence
            if (!user_name || !password) {
                return this.sendError(res, 'Username and password are required', 200);
            }

            // Check if admin exists in the database
            const admin = await Admin.findByUsername(user_name);
            console.log('Admin:', admin);  // Check if admin is null or valid

            if (!admin) {
                return this.sendError(res, 'Admin not found', 200);
            }

            // Compare the provided password with the hashed password stored in the database
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            console.log('Is password valid:', isPasswordValid);  // Should be true or false

            if (!isPasswordValid) {
                return this.sendError(res, 'Invalid email or password', 200);
            }

            if (admin.status === 0) {
                return res.redirect('/admin/login');
              }

              const permissions = await this.admin.getPermissions(admin.id);
              const permissionsInt = permissions.map(Number); // Convert to integers

              console.log('permissions:', permissionsInt);
    
          if (admin.type !== 'admin' && permissions.length === 0) {
            res.redirect('/admin/login');
            return ;
          }

          console.log("session:",req.session.admin)
    

            // Store admin details in session
            req.session.admin = {
                id: admin.id,
                user_name: admin.user_name,
                type : admin.type
            };
            req.session.permissions = permissionsInt;

            this.sendSuccess(res, {}, 'Logged In Successfully!', 200, '/admin/dashboard')

        } catch (error) {
            console.error('Error during login:', error); // Log the actual error for debugging
            this.sendError(res, 'An error occurred during login', 200);
        }
    }

    // Method to update site settings
    async updateSiteSettings(req, res) {
        try {
            // Extract fields from the request body
            const {
                site_domain, site_name, site_email, site_address, receiving_site_email, site_noreply_email,
                site_phone, footer_copyright, site_facebook, site_twitter, site_instagram, site_linkedin, site_youtube,
                site_spotify, site_etsy,
                site_sandbox,site_processing_fee
            } = req.body;

            // Fetch the current settings from the database to retain existing images if not updated
            const currentSettings = await this.admin.getSettings();

            // Handle uploaded files, retain current image if not uploaded
            const logo_image = req.files['logo_image'] ? req.files['logo_image'][0].filename : currentSettings.logo_image;
            const favicon_image = req.files['favicon_image'] ? req.files['favicon_image'][0].filename : currentSettings.favicon_image;
            const thumb_image = req.files['thumb_image'] ? req.files['thumb_image'][0].filename : currentSettings.thumb_image;


            // Validate required fields
            if (!site_domain || !site_name || !site_email) {
                return this.sendError(res, 'Required fields are missing', 400);
            }

            // Create an object with all the fields to update
            const updateData = {
                site_domain,
                site_name,
                site_email,
                site_address,
                receiving_site_email,
                site_noreply_email,
                site_phone,
                footer_copyright,
                site_facebook: Array.isArray(site_facebook) ? site_facebook.join(',') : site_facebook,
                site_twitter: Array.isArray(site_twitter) ? site_twitter.join(',') : site_twitter,
                site_instagram: Array.isArray(site_instagram) ? site_instagram.join(',') : site_instagram,
                site_linkedin: Array.isArray(site_linkedin) ? site_linkedin.join(',') : site_linkedin,
                site_youtube: Array.isArray(site_youtube) ? site_youtube.join(',') : site_youtube,
                site_spotify: Array.isArray(site_spotify) ? site_spotify.join(',') : site_spotify,
                site_etsy: Array.isArray(site_etsy) ? site_etsy.join(',') : site_etsy,
                logo_image,
                favicon_image,
                thumb_image,
                site_sandbox,
                site_processing_fee
            };

            // Call the model to update the settings
            const result = await this.admin.updateSettings(updateData);

            // Send a success response
            this.sendSuccess(res, {}, 'Settings updated Successfully!', 200, '/admin/site-settings')
        } catch (error) {
            console.error('Error updating settings:', error);
            // Send an error response using the method from BaseController
            return this.sendError(res, 'An error occurred while updating settings', 200);
        }
    }
    async getSiteSettings(req, res) {
        try {
            // Fetch the current settings from the database
            const settings = await this.admin.getSettings();
            console.log(settings,'settings')

            // Render the site settings page and pass the settings to the view
            return res.render('admin/site-settings', {
                title: 'Site Settings',
                settings: settings || {}  // Pass the settings object
            });
        } catch (error) {
            console.error('Error fetching site settings:', error);
            return this.sendError(res, 'An error occurred while fetching site settings', 200);
        }
    }

    async changePassword(req, res) {
        try {
            const { password, npswd, cpswd } = req.body;

            // Validate required fields
            if (!password || !npswd || !cpswd) {
                return this.sendError(res, 'All fields are required', 400);
            }

            // Check if new password and confirmation password match
            if (npswd !== cpswd) {
                return this.sendError(res, 'New password and confirmation do not match', 200);
            }
            // Check if admin session exists
            if (!req.session.admin) {
                return this.sendError(res, 'Admin not authenticated', 200);
            }

            // Find the admin by their session ID
            const adminId = req.session.admin.id;
            const admin = await this.admin.findById(adminId);

            if (!admin) {
                return this.sendError(res, 'Admin not found', 200);
            }

            // Validate the current password
            const isCurrentPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isCurrentPasswordValid) {
                return this.sendError(res, 'Current password is incorrect', 200);
            }

            // Hash the new password
            const hashedNewPassword = await bcrypt.hash(npswd, 10);

            // Update the password in the database
            await this.admin.updatePassword(adminId, hashedNewPassword);

            // Send success response
            return this.sendSuccess(res, {}, 'Password changed successfully', 200);
        } catch (error) {
            console.error('Error changing password:', error);
            return this.sendError(res, 'An error occurred while changing the password', 200);
        }
    }
    // Logout function
    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error during session destruction:", err);
                return this.sendError(res, 'Logout failed', 200); // Error handling
            }
            res.redirect('/admin/login');
        });
    } catch(error) {
        console.error('Error during logout:', error);
        res.status(200).send('Internal Server Error');
    }

    async checkPermissions(req, res, next) {
        try {
          const { admin } = req.session;
          console.log("admin:",admin)
          if (!admin) {
            return res.redirect('/admin/login').send({ error: 'Session expired. Please log in again.' });
          }
    
          if (admin.status === 0) {
            return res.redirect('/admin/login').send({ error: 'Please contact the administrator to activate your account!' });
          }
    
          const permissions = await this.admin.getPermissions(admin.id);
    
          if (admin.type !== 'admin' && permissions.length === 0) {
            return res.redirect('/admin/login').send({ error: 'Insufficient permissions, please contact the administrator!' });
          }
    
          req.session.permissions = permissions;
          next();
        } catch (error) {
          console.error('Error checking permissions:', error);
          res.status(200).send({ error: 'Internal server error' });
        }
      }


}





module.exports = new AdminController();
