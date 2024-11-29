// controllers/api/RiderController.js
const BaseController = require('../baseController');
const moment = require('moment');

const Member = require('../../models/memberModel');
const Rider = require('../../models/riderModel');
const Token = require('../../models/tokenModel');
const Addresses = require('../../models/api/addressModel');
const { validateEmail, validatePhoneNumber, validateRequiredFields, validatePassword } = require('../../utils/validators');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const helpers = require('../../utils/helpers');
const { SMTP_MAIL, SMTP_PASSWORD } = process.env;

class MemberController extends BaseController {
    constructor() {
        super();
        this.member = new Member();
        this.rider = new Rider();
        this.tokenModel = new Token();
        this.addressModel = new Addresses();
    }

    generatePseudoFingerprint(req) {
      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = req.ip || "";
      const acceptHeader = req.headers["accept"] || "";
      const combined = `${userAgent}:${ipAddress}:${acceptHeader}`;
  
      // Create a hash of the combined string for uniqueness
      return crypto.createHash("sha256").update(combined).digest("hex");
    } 
    
    async signUp(req, res) {
      try {
        const {
          full_name,
          email,
          password,
          confirm_password,
          mem_status,
          mem_verified,
          fingerprint, // Keep fingerprint as a parameter
        } = req.body;
        // console.log(req.body);
        const mem_type="user"
        // Clean and trim data
        const cleanedData = {
          full_name: typeof full_name === "string" ? full_name.trim() : "",
          email: typeof email === "string" ? email.trim().toLowerCase() : "",
          password: typeof password === "string" ? password.trim() : "",
          confirm_password:
            typeof confirm_password === "string" ? confirm_password.trim() : "",
          created_at: new Date(),
          mem_status: mem_status || 0,
          mem_verified: mem_verified || 0,
          mem_type:mem_type
        };
        // console.log(cleanedData);
  
        // Validation for empty fields
        if (!validateRequiredFields(cleanedData)) {
          return res
            .status(200)
            .json({ status: 0, msg: "All fields are required." });
        }
        if (cleanedData.password !== cleanedData.confirm_password) {
          return res
            .status(200)
            .json({ status: 0, msg: "Passwords do not match." });
        }
        // Password strength validation
        // const passwordValidation = validatePassword(cleanedData.password);
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
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid email format." });
        }
  
        // Check if email already exists
        const existingUser = await this.member.findByEmail(
          cleanedData.email
        );
        if (existingUser) {
          return res.status(200).json({
            status: 0,
            msg: "Email already exists.",
          });
        }
  
        // Hash the password
        cleanedData.password = await bcrypt.hash(cleanedData.password, 10);
  
        // Remove `confirm_password` as it is not needed in the database
        delete cleanedData.confirm_password;
  
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        cleanedData.otp = parseInt(otp, 10); // Add OTP to cleanedData
        cleanedData.expire_time = moment()
          .add(3, "minutes")
          .format("YYYY-MM-DD HH:mm:ss");
  
        // console.log('Generated OTP:', otp);
        // console.log('cleanedData with OTP:', cleanedData);
  
        // Create the rider
        const userId = await this.member.createMember(cleanedData);
        // console.log("Created user ID:", userId); // Log the created rider ID
  
        // Verify OTP was stored properly
        const createdUser = await this.member.findById(userId);
        // console.log("Created User:", createdUser); // Log the created rider
  
        // console.log('Stored OTP after creation:', createdRider.otp);
  
        // If fingerprint is not provided, generate a pseudo-fingerprint
        let actualFingerprint =
          fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment
  
          const token=await this.storeAndReturnToken(
          userId,
            'user',
            actualFingerprint
          );
  
        this.sendSuccess(
          res,
          { mem_type: mem_type, authToken: token },
          "User registered successfully."
        );
      } catch (error) {
        return res.status(200).json({
          // Changed to status 500 for server errors
          status: 0,
          msg: "An error occurred during registration.",
          error: error.message,
        });
      }
    }
  
    
    async loginUser(req, res) {
      try {
        let { email, password,fingerprint,memType } = req.body;
  
        // Clean and trim data
        email = typeof email === "string" ? email.trim().toLowerCase() : "";
        password = typeof password === "string" ? password.trim() : "";
  
        // Validate required fields
        if (!validateRequiredFields({ email, password })) {
          return res
            .status(200)
            .json({ status: 0, msg: "Email and password are required." });
        }
  
        // Email validation
        if (!validateEmail(email)) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid email format." });
        }
        let existingUser=''
        if(memType==='user'){
          existingUser = await this.member.findByEmail(email)
;
          if (!existingUser) {
            return res
              .status(200)
              .json({ status: 0, msg: "Email or password is incorrect." });
          }
        }
        else if(memType==='rider'){
          existingUser = await this.rider.findByEmail(email)
;
          if (!existingUser) {
            return res
              .status(200)
              .json({ status: 0, msg: "Email or password is incorrect." });
          }
        }
        // Check if the rider exists by email
        if (!existingUser) {
          return res
            .status(200)
            .json({ status: 0, msg: "Email or password is incorrect." });
        }
  // console.log(existingUser)
        // Compare the provided password with the hashed password
        const passwordMatch = await bcrypt.compare(
          password,
          existingUser.password
        );
        if (!passwordMatch) {
          return res
            .status(200)
            .json({ status: 0, msg: "Email or password is incorrect." });
        }
        let actualFingerprint =
            fingerprint || this.generatePseudoFingerprint(req);
        const token=await this.storeAndReturnToken(
          existingUser.id,
          memType,
          actualFingerprint
        );
  
        // Send success response
        this.sendSuccess(
          res,
          { mem_type: memType, authToken: token },
          "Successfully logged in."
        );
      } catch (error) {
        return res.status(200).json({
          status: 0,
          msg: "An error occurred during login.",
          error: error.message,
        });
      }
    }
      


    async ResendOtp(req, res) {
      try {
          const { token, memType } = req.body;
          // console.log("Request body:", req.body);
  
          // Validate the token and memType
          if (!token || !memType) {
              return res.status(200).json({ status: 0, msg: "Token and memType are required." });
          }
  
          // Validate token and get user
          const validationResponse = await this.validateTokenAndGetMember(token, memType);
  
          if (validationResponse.status === 0) {
              // If the token is invalid, return the validation error message
              return res.status(200).json(validationResponse);
          }
  
          const user = validationResponse.user;
  
          // Generate a new OTP
          const newOtp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
          const newExpireTime = new Date();
          newExpireTime.setMinutes(newExpireTime.getMinutes() + 3); // Set expire time to 3 minutes from now
  
          // console.log("Generated OTP:", newOtp, "Expire Time:", newExpireTime);
  
          // Update the OTP and expiry time based on memType
          if (memType === "user") {
              await this.member.updateMemberData(user.id, {
                  otp: newOtp,
                  expire_time: newExpireTime
              });
              return res.status(200).json({
                status: 1,
                msg: "New OTP generated successfully.",
                expire_time: newExpireTime,
            });
          } else if (memType === "rider") {
              await this.rider.updateRiderData(user.id, {
                  otp: newOtp,
                  expire_time: newExpireTime
              });
              return res.status(200).json({
                status: 1,
                msg: "New OTP generated successfully.",
                expire_time: newExpireTime,
            });
          } else {
              return res.status(200).json({ status: 0, msg: "Invalid memType provided." });
          }
  
          // Respond with the new OTP's expiry time
          
      } catch (error) {
          // Server error handling
          console.error("Error in ResendOtp:", error.message);
          return res.status(200).json({
              status: 0,
              msg: "An error occurred while generating a new OTP.",
              error: error.message
          });
      }
  }
  
    async deactivateAccount(req, res) {
        try {
            const { token, reason,memType } = req.body;
            if (!token) {
              return res.status(200).json({ status: 0, msg: "Token is required." });
            }
            const userResponse = await this.validateTokenAndGetMember(token, memType);
        
            if (userResponse.status === 0) {
              // If validation fails, return the error message
              return res.status(200).json(userResponse);
            }
            const member=userResponse.user;

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
            fingerprint || this.generatePseudoFingerprint(req);
        const token=await this.storeAndReturnToken(
         userId,
         existingMember?.mem_type,
          actualFingerprint
        );
            return res.status(200).json({
                status: 1,
                resetToken:token,
                mem_type:existingMember?.mem_type, // Return the reset token to the frontend
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
    async requestPasswordReset(req, res) {
      try {
          const { email, fingerprint } = req.body;

          // Check if the member exists
          const member = await this.member.findByEmail(email);
          if (!member) {
              return res.status(200).json({ success: false, message: 'Email not found.' });
          }
          let actualFingerprint = fingerprint || this.generatePseudoFingerprint(req);
          const tokenType = 'user';
      const token=await this.storeAndReturnToken(
       member?.id,
        member?.mem_type,
        actualFingerprint
      );



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
            // console.log(error)
            // Handle any errors that occur during the process
            return res.status(200).json({
                status: 0,
                msg: 'An error occurred while generating OTP.',
                error: error.message,
            });
        }
    }      

    resetPassword = async (req, res) => {
        try {
            // console.log(req.body)
            const { token, new_password, confirm_password,fingerprint,memType } = req.body;
    
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
    
            if (!token) {
              return res.status(200).json({ status: 0, msg: "Token is required." });
            }
            const userResponse = await this.validateTokenAndGetMember(token, memType);
        
            if (userResponse.status === 0) {
              // If validation fails, return the error message
              return res.status(200).json(userResponse);
            }
            const member=userResponse.user;
            const userId=member?.id
    
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
      const authToken=await this.storeAndReturnToken(
       userId,
        memType,
        actualFingerprint
      );
    
            // Send the success response with the reset token
            return res.status(200).json({
                status: 1,
                msg: "Password updated successfully.",
                authToken: authToken,
                mem_type:memType
                // Send the reset token (or use the existing token)
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

    async verifyEmail(req, res) {
        try {
            const { token, otp,memType } = req.body;
    
            // Validate required fields
            if (!token || !otp) {
                return res.status(200).json({ success: false, message: 'Token and OTP are required.' }); // Changed to 400 for bad request
            }
            const userResponse = await this.validateTokenAndGetMember(token, memType);
      
            if (userResponse.status === 0) {
              // If validation fails, return the error message
              return res.status(200).json(userResponse);
            }
            const user=userResponse.user;
             const storedOtp = parseInt(user.otp, 10);  // Parse stored OTP as an integer (base 10)
            const providedOtp = parseInt(otp, 10); 
            if (storedOtp !== providedOtp) {
                return res.status(200).json({ status: 0, msg: 'Incorrect OTP.' }); // Changed to 400 for incorrect OTP
            } 
            const currentTime = new Date();
            const expireTime = new Date(user.expire_time);
      
            if (currentTime > expireTime) {
              return res.status(200).json({
                status: 0,
                msg: "OTP has expired. Please generate a new OTP.",
              });
            }
            if(memType==='rider'){
              await this.rider.updateRiderVerification(user.id);
            }
            else if(memType==='user'){
              await this.member.updateMemberVerification(user.id);
            }
            
            return res.status(200).json({ status: 1, msg: 'Email verified successfully.' });
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



module.exports = MemberController;
