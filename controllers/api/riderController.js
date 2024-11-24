// controllers/api/RiderController.js
const BaseController = require('../baseController');
const Member = require('../../models/memberModel');

const Rider = require('../../models/riderModel');
const Token = require('../../models/tokenModel');
const { validateEmail, validatePhoneNumber, validateRequiredFields, validatePassword } = require('../../utils/validators');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const helpers = require('../../utils/helpers');
const moment = require('moment');
const pool = require('../../config/db-connection');

class RiderController extends BaseController {
    constructor() {
        super();
        this.rider = new Rider();
        this.tokenModel = new Token();
        this.member = new Member();
    }

    async registerRider(req, res) {

        try {
            const {
                full_name,
                email,
                password,
                confirm_password,
                phone_number,
                dob,
                address,
                city,
                vehicle_owner,
                vehicle_type,
                mem_verified,
                vehicle_registration_num,
                driving_license_num,
                
                
                fingerprint // Keep fingerprint as a parameter
            } = req.body;


            // Clean and trim data
            const cleanedData = {
                full_name: typeof full_name === 'string' ? full_name.trim() : '',
                email: typeof email === 'string' ? email.trim().toLowerCase() : '',
                password: typeof password === "string" ? password.trim() : "",
                confirm_password: typeof confirm_password === "string" ? confirm_password.trim() : "",
                phone_number: typeof phone_number === 'string' ? phone_number.trim() : '',
                dob: typeof dob === 'string' ? dob.trim() : '',
                address: typeof address === 'string' ? address.trim() : '',
                city: typeof city === 'string' ? city.trim() : '',
                vehicle_owner: vehicle_owner || 0,
                vehicle_type: typeof vehicle_type === 'string' ? vehicle_type.trim() : '',
                vehicle_registration_num: typeof vehicle_registration_num === 'string' ? vehicle_registration_num.trim() : '',
                driving_license_num: typeof driving_license_num === 'string' ? driving_license_num.trim() : '',
                created_date: new Date(),
                status: 1,
                mem_verified: mem_verified || 0,            };

            // Validation for empty fields
            if (!validateRequiredFields(cleanedData)) {
                return res.status(200).json({ status: 0, msg: 'All fields are required.' });
            }

            if (cleanedData.password !== cleanedData.confirm_password) {
                return res
                  .status(200)
                  .json({ status: 0, msg: "Passwords do not match." });
              }
            //   const passwordValidation = validatePassword(cleanedData.password);
        if (!validatePassword(cleanedData.password)) {
          return res
            .status(200)
            .json({
              status: 0,
              msg: "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one digit, and one special character.",
            });
        }

            // Email validation
            if (!validateEmail(cleanedData.email)) {
                return res.status(200).json({ status: 0, msg: 'Invalid email format.' });
            }


            // Phone number validation
            // if (!validatePhoneNumber(cleanedData.phone_number)) {
            //     return res.status(200).json({ status: 0, msg: 'Invalid phone number format. It should follow UK standards.' });
            // }

            // Check if email already exists
            const existingRider = await this.rider.findByEmail(cleanedData.email);
            // console.log(existingRider);return;
            if (existingRider) {
                return res.status(200).json({
                    status: 0, msg: 'Email already exists.'
                });
            }

            // Hash the password
            cleanedData.password = await bcrypt.hash(cleanedData.password, 10);  

            // Remove `confirm_password` as it is not needed in the database

            delete cleanedData.confirm_password;

            
            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
            cleanedData.otp =  parseInt(otp, 10);;  // Add OTP to cleanedData
            cleanedData.expire_time=moment()
            .add(3, "minutes")
            .format("YYYY-MM-DD HH:mm:ss")
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

            const token = helpers.generateToken(
                `${riderId,'rider'}`
            );

            // Store the token in the tokens table
            await this.tokenModel.storeToken(riderId, token, tokenType, expiryDate, actualFingerprint);

            this.sendSuccess(res, { mem_type:tokenType, authToken:token }, 'Rider registered successfully.');
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0, msg: 'An error occurred during registration.',
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
            // console.log("storedToken:",storedToken[0])
    
            // Find the rider by stored token's rider ID
            const rider = await this.rider.findById(storedToken[0]?.rider_id);
            // console.log("rider id:",storedToken[0].rider_id)

            if (!rider) {
                return res.status(200).json({ success: false, message: 'Rider not found.' }); // Use 404 when rider is not found
            }
            // console.log(rider[0])
            // console.log('Stored OTP:', rider.otp, 'Provided OTP:', otp);
    
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

    // router.post('/upload-image', upload.single('image'), (req, res) => {
uploadRiderLicense = async (req, res) => {
            try {
                // console.log('Request received:', req.body); // Log body
                // console.log('Uploaded file:', req.file); // Log file        
                if (!req.file) {
                    return res.status(200).json({
                        status: 0,
                        msg: 'No file uploaded.',
                    });
                }
        
                const riderLicense = req.file.filename;
                const imagePath = `${riderLicense}`; // Path to the uploaded file
        
                return res.status(200).json({
                    status: 1,
                    msg: 'Image uploaded successfully.',
                    imagePath,
                });
            } catch (error) {
                return res.status(500).json({
                    status: 0,
                    msg: 'An error occurred during image upload.',
                    error: error.message,
                });
            }
    }

    async getRequestQuotesByCity(req, res) {
        try {
            // Extract the token and memType from the request body
            const { token, memType } = req.body;
    
            // Check if the token is provided
            if (!token) {
                return res.status(200).json({ status: 0, msg: "Token is required." });
            }
            // Call the method from BaseController to get the user data
            const userResponse = await this.validateTokenAndGetMember(token, memType);
            console.log("userResponse:",userResponse)
            
            // Check if the userResponse contains city info
            if (!userResponse || !userResponse?.user?.city) {
                return res.status(200).json({ status: 0, msg: "City not found for the given token." });
            }
            const rider=userResponse?.user
            // Extract the city from the userResponse
            const city = rider.city;

            // Fetch quotes by city using the model
        const requestQuotes = await this.rider.getRequestQuotesByCity(city);
    
    
    
        if (requestQuotes.length === 0) {
            return res.status(200).json({ status: 0, msg: "No request quotes found for this city." });
        }

        // Fetch vias and parcels for each quote and construct the response
        // Sequentially fetch vias and parcels for each quote
        const enrichedQuotes = [];
        for (let quote of requestQuotes) {
            const user = await this.member.findById(quote.user_id);
            const vias = await this.rider.getViasByQuoteId(quote.id);
            const parcels = await this.rider.getParcelsByQuoteId(quote.id);
            if(user){
                quote={...quote,user_name:user?.full_name,user_image:user?.mem_image}
            }
            enrichedQuotes.push({
                ...quote,
                source_address: quote.source_address, // Include source address
                destination_address: quote.destination_address, // Include destination address
                vias,
                parcels,
            });
        }

        return res.status(200).json({ 
            status: 1, 
            msg: "Request quotes found.", 
            requests: enrichedQuotes 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 0, msg: "An error occurred.", error: error.message });
    }
}

async assignRiderToRequest(req, res) {
    try {
        const { token, memType, request_id } = req.body;
console.log(req.body)
        // Validate input
        if (!token || !memType || !request_id) {
            return res.status(400).json({ status: 0, msg: "Token, memType, and requestId are required." });
        }

        // Step 1: Validate token and fetch user details
        const userResponse = await this.validateTokenAndGetMember(token, memType);
        if (userResponse.status === 0) {
            return res.status(200).json(userResponse); // Return error from token validation
        }

        const user = userResponse.user;

        // Step 2: Fetch the request quote by ID
        const requestQuote = await this.rider.getRequestQuoteById(request_id);
        if (!requestQuote) {
            return res.status(404).json({ status: 0, msg: "Request quote not found." });
        }

        // Step 3: Check if a rider is already assigned
        if (requestQuote.assigned_rider) {
            return res.status(200).json({ status: 0, msg: "Rider is already assigned to this request." });
        }

        // Step 4: Assign the user ID to the assigned_rider column
        const updateStatus = await this.rider.assignRiderToRequest(request_id, user.id);
        if (updateStatus.affectedRows === 0) {
            return res.status(500).json({ status: 0, msg: "Failed to assign rider to the request." });
        }
        let request_row = await this.rider.getRequestQuoteById(request_id);
        if(request_row){
            const user = await this.member.findById(request_row.user_id);
            const vias = await this.rider.getViasByQuoteId(request_row.id);
            const parcels = await this.rider.getParcelsByQuoteId(request_row.id);
            if(user){
                request_row={...request_row,user_name:user?.full_name,user_image:user?.mem_image,vias:vias,parcels:parcels,rider_name:user?.full_name}
            }
        }
        return res.status(200).json({ status: 1, msg: "Rider assigned successfully.",request_row:request_row });
    } catch (error) {
        console.error("Error assigning rider:", error.message);
        return res.status(500).json({ status: 0, msg: "An error occurred.", error: error.message });
    }
}

                  
        
   
}



module.exports = RiderController;
