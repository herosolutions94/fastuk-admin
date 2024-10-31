// controllers/api/RiderController.js
const BaseController = require('../baseController');
const Rider = require('../../models/riderModel');
const Token = require('../../models/tokenModel');
const { validateEmail, validatePhoneNumber, validateRequiredFields } = require('../../utils/validators');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class RiderController extends BaseController {
    constructor() {
        super();
        this.rider = new Rider();
        this.tokenModel = new Token();
    }

    async registerRider(req, res) {

        try {
            const {
                full_name,
                email,
                phone_number,
                dob,
                address,
                city,
                vehicle_owner,
                vehicle_type,
                vehicle_registration_num,
                driving_license_num,
                status,
                verified,
                
                
                fingerprint // Keep fingerprint as a parameter
            } = req.body;

            const drivingLicense = req.files["driving_license"][0].filename;


            // Clean and trim data
            const cleanedData = {
                full_name: typeof full_name === 'string' ? full_name.trim() : '',
                email: typeof email === 'string' ? email.trim().toLowerCase() : '',
                phone_number: typeof phone_number === 'string' ? phone_number.trim() : '',
                dob: typeof dob === 'string' ? dob.trim() : '',
                address: typeof address === 'string' ? address.trim() : '',
                city: typeof city === 'string' ? city.trim() : '',
                vehicle_owner: vehicle_owner || 0,
                vehicle_type: typeof vehicle_type === 'string' ? vehicle_type.trim() : '',
                vehicle_registration_num: typeof vehicle_registration_num === 'string' ? vehicle_registration_num.trim() : '',
                driving_license_num: typeof driving_license_num === 'string' ? driving_license_num.trim() : '',
                driving_license: drivingLicense,  // Change this to match your DB column name
                created_date: new Date(),
                status: status || 0,
                verified: verified || 0,
            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ success: false, message: 'All fields are required.' });
            }

            // Email validation
            if (!validateEmail(cleanedData.email)) {
                return res.status(200).json({ success: false, message: 'Invalid email format.' });
            }

            // Phone number validation
            if (!validatePhoneNumber(cleanedData.phone_number)) {
                return res.status(200).json({ success: false, message: 'Invalid phone number format. It should follow UK standards.' });
            }

            // Check if email already exists
            const existingRider = await this.rider.findByEmail(cleanedData.email);
            if (existingRider) {
                return res.status(200).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }

            // Hash the password
            // cleanedData.password = await bcrypt.hash(password, 10);  
            
            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
            cleanedData.otp =  parseInt(otp, 10);;  // Add OTP to cleanedData

            // console.log('Generated OTP:', otp);
            // console.log('cleanedData with OTP:', cleanedData);


            // Create the rider
            const riderId = await this.rider.createRider(cleanedData);
            // console.log('Created Rider ID:', riderId); // Log the created rider ID


            // Verify OTP was stored properly
        const createdRider = await this.rider.findById(riderId);
        // console.log('Created Rider:', createdRider); // Log the created rider
 
        // console.log('Stored OTP after creation:', createdRider.otp); 

            // If fingerprint is not provided, generate a pseudo-fingerprint
            let actualFingerprint = fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment


            // Generate a random number and create the token
            const randomNum = crypto.randomBytes(16).toString('hex');
            const tokenType = 'rider';
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

            // Create the token
            const token = crypto.createHash('sha256').update(`${randomNum}-${tokenType}-${riderId}`).digest('hex');

            // Store the token in the tokens table
            await this.tokenModel.storeToken(riderId, token, tokenType, expiryDate, actualFingerprint);

            this.sendSuccess(res, { riderId, token }, 'Rider registered successfully.');
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                success: false,
                message: 'An error occurred during registration.',
                error: error.message
            });
        }
    ;
    }

    generatePseudoFingerprint(req) {
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || '';
        const acceptHeader = req.headers['accept'] || '';
        const combined = `${userAgent}:${ipAddress}:${acceptHeader}`;
        
        // Create a hash of the combined string for uniqueness
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
    async loginRider(req, res) {
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
            const existingRider = await this.rider.findByEmail(email);
            if (!existingRider) {
                return res.status(200).json({ success: false, message: 'Email or password is incorrect.' });
            }

            // Compare the provided password with the hashed password
            const passwordMatch = await bcrypt.compare(password, existingRider.password);
            if (!passwordMatch) {
                return res.status(200).json({ success: false, message: 'Email or password is incorrect.' });
            }

            // Generate a random number and create the token
            const randomNum = crypto.randomBytes(16).toString('hex');
            const tokenType = 'rider';
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

            // Create the token
            const token = crypto.createHash('sha256').update(`${randomNum}-${tokenType}-${existingRider.id}`).digest('hex');

            // Store the token in the tokens table (optional, based on your implementation)
            await this.tokenModel.storeToken(existingRider.id, token, tokenType, expiryDate);

            // Send success response
            this.sendSuccess(res, { riderId: existingRider.id, token }, 'Successfully logged in.');
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
            if (!storedToken) {
                return res.status(200).json({ success: false, message: 'Invalid token.' }); // Changed to 400 for invalid token
            }
            console.log("storedToken:",storedToken[0])
    
            // Find the rider by stored token's rider ID
            const rider = await this.rider.findById(storedToken[0]?.rider_id);
            console.log("rider id:",storedToken[0].rider_id)

            if (!rider) {
                return res.status(200).json({ success: false, message: 'Rider not found.' }); // Use 404 when rider is not found
            }
            console.log(rider[0])
            console.log('Stored OTP:', rider.otp, 'Provided OTP:', otp);
    
            // Parse OTPs as integers to avoid comparison issues
            const storedOtp = parseInt(rider.otp, 10);  // Parse stored OTP as an integer (base 10)
            const providedOtp = parseInt(otp, 10);      // Parse provided OTP as an integer (base 10)
    
            // Verify OTP
            if (storedOtp !== providedOtp) {
                return res.status(200).json({ success: false, message: 'Incorrect OTP.' }); // Changed to 400 for incorrect OTP
            }
    
            // If OTP matches, update the rider's verified status
            await this.rider.updateRiderVerification(rider.id);
    
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
   
}



module.exports = RiderController;
