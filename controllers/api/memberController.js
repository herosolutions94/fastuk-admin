// controllers/api/RiderController.js
const BaseController = require('../baseController');
const Member = require('../../models/memberModel');
const Token = require('../../models/tokenModel');
const { validateEmail, validatePhoneNumber, validateRequiredFields } = require('../../utils/validators');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { SMTP_MAIL, SMTP_PASSWORD } = process.env;

class MemberController extends BaseController {
    constructor() {
        super();
        this.member = new Member();
        this.tokenModel = new Token();
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

    async verifyEmail(req, res) {
        try {
            const { token, otp } = req.body;
    
            // Validate required fields
            if (!token || !otp) {
                return res.status(200).json({ success: false, message: 'Token and OTP are required.' }); // Changed to 400 for bad request
            }
            // Find the token in the database
            const storedToken = await this.tokenModel.findByToken(token);
            if (!storedToken || !storedToken.user_id || storedToken.expiry_date < new Date()) {
                return res.status(200).json({ success: false, message: 'Invalid or expired token.' }); // Changed to 400 for invalid token
            }
            console.log("storedToken:",storedToken[0])
    
            // Find the rider by stored token's rider ID
            const member = await this.member.findById(storedToken[0]?.user_id);
            console.log("member id:",storedToken[0].member_id)

            if (!member) {
                return res.status(200).json({ success: false, message: 'Member not found.' }); // Use 404 when rider is not found
            }
            console.log(member[0])
            console.log('Stored OTP:', member.otp, 'Provided OTP:', otp);
    
            // Parse OTPs as integers to avoid comparison issues
            const storedOtp = parseInt(member.otp, 10);  // Parse stored OTP as an integer (base 10)
            const providedOtp = parseInt(otp, 10);      // Parse provided OTP as an integer (base 10)
    
            // Verify OTP
            if (storedOtp !== providedOtp) {
                return res.status(200).json({ success: false, message: 'Incorrect OTP.' }); // Changed to 400 for incorrect OTP
            }
    
            // If OTP matches, update the rider's verified status
            await this.member.updateMemberVerification(member.id);
    
            // // Remove or invalidate the token
            // await this.tokenModel.deleteToken(token);
    
            // Success response
            return res.status(200).json({ success: true, message: 'Email verified successfully.' });
        } catch (error) {
            // Server error handling
            return res.status(200).json({
                success: false,
                message: 'An error occurred during email verification.',
                error: error.message
            });
        }
    }

    async requestPasswordReset(req, res) {
        try {
            const { email , fingerprint} = req.body;
    
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
            const insertId = await this.tokenModel.storeToken(member.id, tokenType, resetToken, 'reset', expiryDate,actualFingerprint);
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
   
}



module.exports = MemberController;
