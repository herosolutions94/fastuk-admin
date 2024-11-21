// controllers/api/RiderController.js
const BaseController = require('../baseController');
const Member = require('../../models/memberModel');
const Token = require('../../models/tokenModel');
const Addresses = require('../../models/api/addressModel');
const { validateEmail, validatePhoneNumber, validateRequiredFields } = require('../../utils/validators');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const helpers = require('../../utils/helpers');
const { SMTP_MAIL, SMTP_PASSWORD } = process.env;

class MemberController extends BaseController {
    constructor() {
        super();
        this.member = new Member();
        this.tokenModel = new Token();
        this.addressModel = new Addresses();
    }

    async registerMember(req, res) {
        try {
            const {
                mem_type,
                full_name,
                email,
                password,
                confirmPassword,  // Receive confirmPassword in the request
                mem_status,
                mem_verified,
                fingerprint
            } = req.body;

            // Clean and trim data
            const cleanedData = {
                mem_type: typeof mem_type === 'string' ? mem_type.trim() : '',
                full_name: typeof full_name === 'string' ? full_name.trim() : '',
                email: typeof email === 'string' ? email.trim() : '',
                password: typeof password === 'string' ? password.trim() : '',
                created_at: new Date(),
                mem_status: mem_status || 0,
                mem_verified: mem_verified || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData) || !confirmPassword) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }

            // Confirm password validation
            if (password !== confirmPassword) {
                return res.status(200).json({ success: false, message: 'Passwords do not match.' });
            }

            // Email validation
            if (!validateEmail(cleanedData.email)) {
                return res.status(200).json({ success: false, message: 'Invalid email format.' });
            }

            // Check if email already exists
            const existingMember = await this.member.findByEmail(cleanedData.email);
            if (existingMember) {
                return res.status(200).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }

            // Hash the password
            cleanedData.password = await bcrypt.hash(password, 10);

            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000);
            cleanedData.otp = parseInt(otp, 10);

            // Create the member
            const memberId = await this.member.createMember(cleanedData);

            // Verify OTP was stored properly
            const createdMember = await this.member.findById(memberId);

            // If fingerprint is not provided, generate a pseudo-fingerprint
            let actualFingerprint = fingerprint || this.generatePseudoFingerprint(req);

            // Generate token
            const randomNum = crypto.randomBytes(16).toString('hex');
            const tokenType = 'member';
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);

            const token = crypto.createHash('sha256').update(`${randomNum}-${tokenType}-${memberId}`).digest('hex');

            // Store the token in the tokens table
            await this.tokenModel.storeToken(memberId, token, tokenType, expiryDate, actualFingerprint);

            this.sendSuccess(res, { memberId, token }, 'Member registered successfully.');
        } catch (error) {
            return res.status(200).json({
                success: false,
                message: 'An error occurred during registration.',
                error: error.message
            });
        }
    }


    generatePseudoFingerprint(req) {
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || '';
        const acceptHeader = req.headers['accept'] || '';
        const combined = `${userAgent}:${ipAddress}:${acceptHeader}`;

        // Create a hash of the combined string for uniqueness
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
    async loginMember(req, res) {
        try {
            let { email, password } = req.body;

            // Clean and trim data
            email = typeof email === 'string' ? email.trim().toLowerCase() : '';
            password = typeof password === 'string' ? password.trim() : '';


            // Validate required fields
            if (!validateRequiredFields({ email, password })) {
                return res.status(200).json({ success: false, message: 'Email and password are required.' });
            }

            // Email validation
            if (!validateEmail(email)) {
                return res.status(200).json({ success: false, message: 'Invalid email format.' });
            }

            // Check if the rider exists by email
            const existingMember = await this.member.findByEmail(email);
            if (!existingMember) {
                return res.status(200).json({ success: false, message: 'Email or password is incorrect.' });
            }

            // Compare the provided password with the hashed password
            const passwordMatch = await bcrypt.compare(password, existingMember.password);
            if (!passwordMatch) {
                return res.status(200).json({ success: false, message: 'Email or password is incorrect.' });
            }

            // Generate a random number and create the token
            const randomNum = crypto.randomBytes(16).toString('hex');
            const tokenType = 'member';
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

            // Create the token
            const token = crypto.createHash('sha256').update(`${randomNum}-${tokenType}-${existingMember.id}`).digest('hex');

            // Store the token in the tokens table (optional, based on your implementation)
            await this.tokenModel.storeToken(existingMember.id, token, tokenType, expiryDate);

            // Send success response
            this.sendSuccess(res, { memberId: existingMember.id, token }, 'Successfully logged in.');
        } catch (error) {
            return res.status(200).json({
                success: false,
                message: 'An error occurred during login.',
                error: error.message
            });
        }
    }
    async ResendOtp(req, res) {
        try {
            const { token } = req.body;
            console.log(req.body);

            // Validate the token
            if (!token) {
                return res.status(200).json({ status: 0, msg: 'Token is required.' });
            }

            // Find the token in the database
            const storedToken = await this.tokenModel.findByToken(token);
            if (!storedToken || !storedToken.user_id || storedToken.expiry_date < new Date()) {
                return res.status(200).json({ status: 0, msg: 'Invalid or expired token.' });
            }

            console.log("Stored Token:", storedToken);

            // Find the member by user ID
            const member = await this.member.findById(storedToken.user_id);
            console.log("Member ID:", storedToken.user_id);

            if (!member) {
                return res.status(200).json({ status: 0, msg: 'Member not found.' });
            }

            // Generate a new OTP
            const newOtp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
            const newExpireTime = new Date();
            newExpireTime.setMinutes(newExpireTime.getMinutes() + 3); // Set expire time to 3 minutes from now

            console.log("Generated OTP:", newOtp, "Expire Time:", newExpireTime);

            // Update the OTP and expire_time in the members table
            await this.member.updateMemberData(member.id, {
                otp: newOtp,
                expire_time: newExpireTime
            });

            // Respond with the new OTP's expiry time
            return res.status(200).json({
                status: 1,
                msg: 'New OTP generated successfully.',
                expire_time: newExpireTime,
            });
        } catch (error) {
            // Server error handling
            console.error("Error generating new OTP:", error);
            return res.status(200).json({
                status: 0,
                msg: 'An error occurred while generating a new OTP.',
                error: error.message
            });
        }
    }
    async deactivateAccount(req, res) {
        try {
            const { token, reason } = req.body;
            console.log(req.body);

            // Validate the token
            if (!token) {
                return res.status(200).json({ status: 0, msg: 'Token is required.' });
            }

            // Find the token in the database
            const storedToken = await this.tokenModel.findByToken(token);
            if (!storedToken || !storedToken.user_id || storedToken.expiry_date < new Date()) {
                return res.status(200).json({ status: 0, msg: 'Invalid or expired token.' });
            }

            console.log("Stored Token:", storedToken);

            // Find the member by user ID
            const member = await this.member.findById(storedToken.user_id);
            console.log("Member ID:", storedToken.user_id);

            if (!member) {
                return res.status(200).json({ status: 0, msg: 'Member not found.' });
            }

            // Generate a new OTP


            // Update the OTP and expire_time in the members table
            await this.member.updateMemberData(member.id, {
                deactivated_reason: reason,
                is_deactivated: 1
            });

            // Respond with the new OTP's expiry time
            return res.status(200).json({
                status: 1,
                msg: 'Account Deactivated successfully!',
            });
        } catch (error) {
            // Server error handling
            console.error("Error generating new OTP:", error);
            return res.status(200).json({
                status: 0,
                msg: 'An error occurred while generating a new OTP.',
                error: error.message
            });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { token, otp } = req.body;
            console.log(req.body);

            // Validate required fields
            if (!token || !otp) {
                return res.status(200).json({ status: 0, msg: 'Token and OTP are required.' }); // Changed to 400 for bad request
            }
            // Find the token in the database
            const storedToken = await this.tokenModel.findByToken(token);
            if (!storedToken || !storedToken.user_id || storedToken.expiry_date < new Date()) {
                return res.status(200).json({ status: 0, msg: 'Invalid or expired token.' }); // Changed to 400 for invalid token
            }
            console.log("storedToken:", storedToken)

            // Find the rider by stored token's rider ID
            const member = await this.member.findById(storedToken?.user_id);
            console.log("member id:", storedToken.user_id)

            if (!member) {
                return res.status(200).json({ status: 0, msg: 'Member not found.' }); // Use 404 when rider is not found
            }
            console.log(member[0])
            console.log('Stored OTP:', member.otp, 'Provided OTP:', otp);
            const currentTime = new Date();
            const expireTime = new Date(member.expire_time);

            if (currentTime > expireTime) {
                return res.status(200).json({
                    status: 0,
                    msg: 'OTP has expired. Please generate a new OTP.',
                });
            }
            // Parse OTPs as integers to avoid comparison issues
            const storedOtp = parseInt(member.otp, 10);  // Parse stored OTP as an integer (base 10)
            const providedOtp = parseInt(otp, 10);      // Parse provided OTP as an integer (base 10)

            // Verify OTP
            if (storedOtp !== providedOtp) {
                return res.status(200).json({ status: 0, msg: 'OTP is invalid.' }); // Changed to 400 for incorrect OTP
            }

            // If OTP matches, update the rider's verified status
            await this.member.updateMemberVerification(member.id);

            // // Remove or invalidate the token
            // await this.tokenModel.deleteToken(token);

            // Success response
            return res.status(200).json({ status: 1, msg: 'Email verified successfully.' });
        } catch (error) {
            // Server error handling
            return res.status(200).json({
                status: 0,
                msg: 'An error occurred during email verification.',
                error: error.message
            });
        }
    }

    async requestPasswordReset(req, res) {
        try {
            const { email, fingerprint } = req.body;

            // Check if the member exists
            const member = await this.member.findByEmail(email);
            if (!member) {
                return res.status(200).json({ success: false, message: 'Email not found.' });
            }
            let actualFingerprint = fingerprint || this.generatePseudoFingerprint(req);
            const tokenType = 'member';



            // Generate a reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

            // Store the token in the database with the expiry date
            const insertId = await this.tokenModel.storeToken(member.id, tokenType, resetToken, 'reset', expiryDate, actualFingerprint);
            console.log('Token stored with ID:', insertId);


            // Nodemailer setup
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: SMTP_MAIL,
                    pass: SMTP_PASSWORD
                }
            });

            // Email options
            const mailOptions = {
                from: SMTP_MAIL,
                to: email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Here is your reset token: ${resetToken}\n\nThe token is valid for 1 hour.`
            };

            // Send the email
            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                success: true,
                message: 'Password reset link has been sent to your email.'
            });
        } catch (error) {
            return res.status(200).json({ success: false, message: 'An error occurred.', error: error.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword, confirmPassword } = req.body;

            console.log('Token from request:', token);


            // Validate new password and confirm password
            if (newPassword !== confirmPassword) {
                return res.status(200).json({ success: false, message: 'Passwords do not match.' });
            }

            // Find the token in the database and check if it’s still valid
            const storedToken = await this.tokenModel.findByToken(token);
            if (!storedToken || storedToken.expiry_date < new Date()) {
                return res.status(200).json({ success: false, message: 'Invalid or expired token.' });
            }
            console.log('storedToken:', storedToken);


            // Find the member by the token's member ID
            const member = await this.member.findById(storedToken.memberId);
            console.log('Member found by ID:', member);

            if (!member) {
                return res.status(200).json({ success: false, message: 'Member not found.' });
            }
            console.log('Member found by ID:', member);


            // Hash the new password and update the member's record
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this.member.updatePassword(member.id, hashedPassword);

            // Invalidate the token after successful reset
            await this.tokenModel.deleteToken(token);

            return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
        } catch (error) {
            return res.status(200).json({ success: false, message: 'An error occurred.', error: error.message });
        }
    }

    async getAddresses (req, res) {
        try {
            const { token } = req.body;
    
            // Check if token is provided
            if (!token) {
                return res.status(200).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "Token is required."
                });
            }
    
            // Decrypt the token to get the user ID
            let decryptedToken;
            try {
                decryptedToken = helpers.decryptToken(token);
            } catch (err) {
                return res.status(200).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "Invalid or corrupted token."
                });
            }
    
            const parts = decryptedToken.split("-");
            if (parts.length < 3) {
                return res.status(200).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "Invalid token format."
                });
            }
    
            const userId = parts[2]; // Extract user ID from the token
    
            // Fetch the user by ID
            const user = await this.member.findById(userId);
            if (!user) {
                return res.status(200).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "User not found."
                });
            }
    
            // Fetch all addresses associated with the user
            const addresses = await this.addressModel.getAddressesByUserId(userId);
    console.log(addresses)
            // Return the array of addresses
            return res.status(200).json({
                status: 1,
                addresses: addresses?.length<=0 ? [] : addresses
            });
    
        } catch (error) {
            console.error("Error fetching addresses:", error.message);
            return res.status(200).json({
                status: 0,
                msg: "Server error.",
                details: error.message
            });
        }
    };

    async getAndInsertAddress (req, res)  {
        try {
            const { token, first_name, last_name, phone_number, address, post_code, city } = req.body;
    
            // Validate token
            if (!token) {
                return res.status(401).json({
                    status: 0,
                    msg: "Token is required."
                });
            }
    
            // Decrypt token to get userId
            let decryptedToken;
            try {
                decryptedToken = helpers.decryptToken(token); // Assuming decryptToken is implemented
            } catch (err) {
                return res.status(401).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "Invalid or corrupted token."
                });
            }
    
            const parts = decryptedToken.split("-");
            if (parts.length < 3) {
                return res.status(401).json({
                    status: 0,
                    msg: "Invalid token format."
                });
            }
    
            const userId = parts[2];
    
            // Validate input data
            if (!first_name || !last_name || !phone_number || !address || !city || !post_code) {
                return res.status(400).json({
                    status: 0,
                    msg: "Address  city, and postcode are required."
                });
            }

            // Check if user already has addresses
        const existingAddresses = await this.addressModel.getAddressesByUserId(userId);

        // Determine default value
        const isDefault = existingAddresses.length === 0 ? 1 : 0;
    
            // Insert the address into the database
            const newAddress = {
            mem_id:userId,
            first_name,
            last_name,
            phone_number,
            address,
            post_code,
            city,
            default:isDefault
            };
            console.log(newAddress)
            const insertedAddress = await this.addressModel.insertAddress(newAddress);
    
            // Fetch all addresses for the user
            const addresses = await this.addressModel.getAddressesByUserId(userId);
    
            return res.status(200).json({
                status: 1,
                msg: "Address added successfully.",
                addresses:addresses
            });
        } catch (error) {
            console.error("Error in getAndInsertAddress:", error.message);
            return res.status(500).json({
                status: 0,
                msg: "Server error.",
                details: error.message
            });
        }
    
    }   
    async updateAddress (req, res)  {
        try {
            const { token, first_name, last_name, phone_number, address, post_code, city,address_id } = req.body;
    
            // Validate token
            if (!token) {
                return res.status(200).json({
                    status: 0,
                    msg: "Token is required."
                });
            }
            if (!address_id) {
                return res.status(200).json({
                    status: 0,
                    msg: "Address is required."
                });
            }
    
            // Decrypt token to get userId
            let decryptedToken;
            try {
                decryptedToken = helpers.decryptToken(token); // Assuming decryptToken is implemented
            } catch (err) {
                return res.status(401).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "Invalid or corrupted token."
                });
            }
    
            const parts = decryptedToken.split("-");
            if (parts.length < 3) {
                return res.status(401).json({
                    status: 0,
                    msg: "Invalid token format."
                });
            }
    
            const userId = parts[2];
    
            // Validate input data
            if (!first_name || !last_name || !phone_number || !address || !city || !post_code) {
                return res.status(400).json({
                    status: 0,
                    msg: "Address  city, and postcode are required."
                });
            }
            const address_row=await this.addressModel.getAddressById(address_id,userId);
            if(!address_row){
                return res.status(200).json({
                    status: 0,
                    msg: "Address is required."
                });
            }
            // Insert the address into the database
            const newAddress = {
            first_name,
            last_name,
            phone_number,
            address,
            post_code,
            city,
            };
            console.log(newAddress)
            const insertedAddress = await this.addressModel.updateData(address_id,newAddress);
    
            // Fetch all addresses for the user
            const addresses = await this.addressModel.getAddressesByUserId(userId);
    
            return res.status(200).json({
                status: 1,
                msg: "Address updated successfully.",
                addresses:addresses
            });
        } catch (error) {
            console.error("Error in getAndInsertAddress:", error.message);
            return res.status(500).json({
                status: 0,
                msg: "Server error.",
                details: error.message
            });
        }
    
    }
    async deleteAddress (req, res)  {
        try {
            const { token, address_id } = req.body;
    
            // Validate token
            if (!token) {
                return res.status(200).json({
                    status: 0,
                    msg: "Token is required."
                });
            }
            if (!address_id) {
                return res.status(200).json({
                    status: 0,
                    msg: "Address is required."
                });
            }
    
            // Decrypt token to get userId
            let decryptedToken;
            try {
                decryptedToken = helpers.decryptToken(token); // Assuming decryptToken is implemented
            } catch (err) {
                return res.status(401).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "Invalid or corrupted token."
                });
            }
    
            const parts = decryptedToken.split("-");
            if (parts.length < 3) {
                return res.status(401).json({
                    status: 0,
                    msg: "Invalid token format."
                });
            }
    
            const userId = parts[2];
    
            
            const address_row=await this.addressModel.getAddressById(address_id,userId);
            if(!address_row){
                return res.status(200).json({
                    status: 0,
                    msg: "Address is required."
                });
            }
            
            const insertedAddress = await this.addressModel.deleteAddress(address_id);
    
            // Fetch all addresses for the user
            const addresses = await this.addressModel.getAddressesByUserId(userId);
    
            return res.status(200).json({
                status: 1,
                msg: "Address deleted successfully.",
                addresses:addresses
            });
        } catch (error) {
            console.error("Error in getAndInsertAddress:", error.message);
            return res.status(500).json({
                status: 0,
                msg: "Server error.",
                details: error.message
            });
        }
    
    }

    async setAsDefaultAddress(req, res) {
        try {
            const { token, address_id } = req.body;
    
            // Validate token
            if (!token) {
                return res.status(200).json({
                    status: 0,
                    msg: "Token is required.",
                });
            }
            if (!address_id) {
                return res.status(200).json({
                    status: 0,
                    msg: "Address ID is required.",
                });
            }
    
            // Decrypt token to get userId
            let decryptedToken;
            try {
                decryptedToken = helpers.decryptToken(token);
            } catch (err) {
                return res.status(401).json({
                    status: 0,
                    not_logged_in: true,
                    msg: "Invalid or corrupted token.",
                });
            }
    
            const parts = decryptedToken.split("-");
            if (parts.length < 3) {
                return res.status(401).json({
                    status: 0,
                    msg: "Invalid token format.",
                });
            }
    
            const userId = parts[2];
    
            // Check if the address exists for the user
            const address_row = await this.addressModel.getAddressById(address_id, userId);
            if (!address_row) {
                return res.status(200).json({
                    status: 0,
                    msg: "Address not found or does not belong to the user.",
                });
            }
    
            // Reset default for all addresses
            await this.addressModel.resetDefaultStatusForUser(userId);
            console.log("All addresses reset to default = 0");
    
            // Set specific address as default
            const isDefaultSet = await this.addressModel.setAsDefaultAddress(address_id);
            if (!isDefaultSet) {
                return res.status(500).json({
                    status: 0,
                    msg: "Failed to set address as default.",
                });
            }
            console.log(`Address ${address_id} set as default`);
    
            // Fetch updated addresses for the user
            const addresses = await this.addressModel.getAddressesByUserId(userId);
            if (!addresses || addresses.length === 0) {
                return res.status(200).json({
                    status: 0,
                    msg: "No addresses found.",
                });
            }
    
            return res.status(200).json({
                status: 1,
                msg: "Address set as default successfully.",
                addresses: addresses,
            });
        } catch (error) {
            console.error("Error in setAsDefaultAddress:", error.message);
            return res.status(500).json({
                status: 0,
                msg: "Server error.",
                details: error.message,
            });
        }
    }

     // API to generate OTP for the provided email
     async forgetPassword(req, res) {
        try {
            const { email } = req.body;

            // Validate if email is provided
            if (!email) {
                return res.status(200).json({ status: 0, msg: 'Email is required.' });
            }

            // Clean the email data
            const cleanedEmail = typeof email === 'string' ? email.trim() : '';

            // Check if the email exists in the database
            const existingMember = await this.member.findByEmail(cleanedEmail);
            if (!existingMember) {
                return res.status(200).json({
                    status: 0,
                    msg: 'Email does not exist in the system.',
                });
            }

            // Generate a random OTP
            const otp = Math.floor(100000 + Math.random() * 900000); // OTP between 100000 and 999999

            // Store the OTP in the member record
            existingMember.otp = otp;
            await this.member.updateOtp(existingMember.id, otp);

            // Send success response
            return res.status(200).json({
                status: 1, // OTP generated successfully
                msg: 'An otp is sent to your email.',
            });
        } catch (error) {
            console.log(error)
            // Handle any errors that occur during the process
            return res.status(200).json({
                status: 0,
                msg: 'An error occurred while generating OTP.',
                error: error.message,
            });
        }
    }
    // API to verify OTP, generate a reset token, and store it
    async verifyOtpAndGenerateToken(req, res) {
        try {
            const { otp,fingerprint } = req.body;
    
            // Validate input
            if (!otp) {
                return res.status(200).json({ status: 0, msg: 'OTP is required.' });
            }
    
            // Clean the OTP data
            const cleanedOtp = parseInt(otp, 10);
    
            // Check if the OTP exists in the database and get the member
            const existingMember = await this.member.findByOtp(cleanedOtp);  // Assuming you have a method findByOtp
    
            if (!existingMember) {
                return res.status(200).json({
                    status: 0,
                    msg: 'OTP does not exist in the system.',
                });
            }
    
            // Validate OTP from the database
            if (existingMember.otp !== cleanedOtp) {
                return res.status(200).json({
                    status: 0,
                    msg: 'Invalid OTP.',
                });
            }
    
            // OTP is correct, now generate a reset token
            let userId = existingMember?.id;
            let actualFingerprint =
            fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment
    
          // Generate a random number and create the token
          const randomNum = crypto.randomBytes(16).toString("hex");
          const tokenType = "user";
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour
    
          // Create the token
          const token = helpers.generateToken(
            `${userId}-${randomNum}-${tokenType}`
          );
          await this.tokenModel.storeToken(
            userId,
            token,
            tokenType,
            expiryDate,
            actualFingerprint
          );
            return res.status(200).json({
                status: 1,
                resetToken:token, // Return the reset token to the frontend
                msg: 'OTP verified successfully and reset token generated.',
            });
        } catch (error) {
            // Handle any errors
            return res.status(200).json({
                status: 0,
                msg: 'An error occurred while verifying OTP and generating reset token.',
                error: error.message,
            });
        }
    }

    resetPassword = async (req, res) => {
        try {
            console.log(req.body)
            const { token, new_password, confirm_password,fingerprint } = req.body;
    
            // Check if all fields are provided
            if (!token || !new_password || !confirm_password) {
                return res.status(200).json({
                    status: 0,
                    msg: "All fields are required.",
                });
            }
    
            // Validate that the new password and confirm password match
            if (new_password !== confirm_password) {
                return res.status(200).json({
                    status: 0,
                    msg: "New password and confirm password do not match.",
                });
            }
    
            // Decode the token to extract user ID
            let decryptedToken;
            try {
                decryptedToken = helpers.decryptToken(token); // Decrypt token using helper method
            } catch (err) {
                return res.status(200).json({
                    status: 0,
                    msg: "Invalid or corrupted token.",
                });
            }
    
            const parts = decryptedToken.split("-");
            if (parts.length < 3) {
                return res
                    .status(200)
                    .json({ status: 0, msg: "Invalid token format." });
            }
    
            const userId = parts[2]; // Extract user ID from the token
    
            // Get the user from the database
            const member = await this.member.findById(userId);
            if (!member) {
                return res.status(404).json({
                    status: 0,
                    msg: "User not found.",
                });
            }
    
            // Hash the new password before saving
            const hashedPassword = await bcrypt.hash(new_password, 10);
    
            // Update the user's password in the database
            const updatedMemberData = {
                password: hashedPassword,
            };
            await this.member.updateMemberData(userId, updatedMemberData); // Assuming `updateMemberData` is a function that updates the user's data in the DB
    
            // Optionally, you can regenerate a new token if needed
            let actualFingerprint =
            fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment
    
          // Generate a random number and create the token
          const randomNum = crypto.randomBytes(16).toString("hex");
          const tokenType = "user";
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour
    
          // Create the token
          const authToken = helpers.generateToken(
            `${userId}-${randomNum}-${tokenType}`
          );
          await this.tokenModel.storeToken(
            userId,
            authToken,
            tokenType,
            expiryDate,
            actualFingerprint
          );// Generate a new token (or use the same token if appropriate)
    
            // Send the success response with the reset token
            return res.status(200).json({
                status: 1,
                msg: "Password updated successfully.",
                authToken: authToken, // Send the reset token (or use the existing token)
            });
        } catch (error) {
            console.error("Error changing password:", error.message);
            return res.status(500).json({
                status: 0,
                msg: "Server error.",
                details: error.message,
            });
        }
    };
    
    
    

    
        
    

}



module.exports = MemberController;
