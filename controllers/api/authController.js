// controllers/api/RiderController.js
const BaseController = require("../baseController");
const moment = require("moment");

const Member = require("../../models/memberModel");
const Rider = require("../../models/riderModel");
const Token = require("../../models/tokenModel");
const Addresses = require("../../models/api/addressModel");
const {
  validateEmail,
  validatePhoneNumber,
  validateRequiredFields,
  validatePassword
} = require("../../utils/validators");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const helpers = require("../../utils/helpers");
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
  async businessSignUp(req, res) {
    try {
      const {
        business_name,
        business_type,
        business_address,
        city,
        password,
        confirm_password,
        full_name,
        designation,
        email,
        phone,
        fingerprint,
        parcel_type,
        parcel_weight,
        shipment_volume,
        delivery_speed
      } = req.body;

      const mem_type = "business";
      const is_approved = "pending";

      // Clean and trim data
      const cleanedData = {
        business_name:
          typeof business_name === "string" ? business_name.trim() : "",
        full_name: typeof full_name === "string" ? full_name.trim() : "",
        mem_city: typeof city === "string" ? city.trim() : "",
        designation: typeof designation === "string" ? designation.trim() : "",
        email: typeof email === "string" ? email.trim().toLowerCase() : "",
        password: typeof password === "string" ? password.trim() : "",
        confirm_password:
          typeof confirm_password === "string" ? confirm_password.trim() : "",
        business_type:
          typeof business_type === "string" ? business_type.trim() : "",
        mem_address1:
          typeof business_address === "string" ? business_address.trim() : "",
        mem_phone: typeof phone === "string" ? phone.trim() : "",
        parcel_type: typeof parcel_type === "string" ? parcel_type.trim() : "",
        parcel_weight:
          typeof parcel_weight === "string" ? parcel_weight.trim() : "",
        shipment_volume:
          typeof shipment_volume === "string" ? shipment_volume.trim() : "",
        delivery_speed:
          typeof delivery_speed === "string" ? delivery_speed.trim() : "",
        created_at: new Date(),
        mem_status: 1,
        mem_verified: 0,
        mem_phone_verified:0,
        mem_type: mem_type,
        is_approved: is_approved
      };

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
      if (!validatePassword(cleanedData.password)) {
        return res.status(200).json({
          status: 0,
          msg: "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one digit, and one special character."
        });
      }

      // Email validation
      if (!validateEmail(cleanedData.email)) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid business email format." });
      }

      // Check if email already exists
      const existingUser = await this.member.findByEmail(cleanedData.email);
      if (existingUser) {
        return res
          .status(200)
          .json({ status: 0, msg: "Business email already exists." });
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
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Initialize Stripe with your secret key
      const customer = await stripe.customers.create({
        name: cleanedData.full_name,
        email: cleanedData.email
      });

      if (!customer || !customer.id) {
        return res
          .status(200)
          .json({ status: 0, msg: "Failed to create customer in Stripe." });
      }

      // Add Stripe customer ID to cleanedData
      cleanedData.customer_id = customer.id;
      // Create the business account
      const businessId = await this.member.createMember(cleanedData);

      // If fingerprint is not provided, generate a pseudo-fingerprint
      const actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req);

      const token = await this.storeAndReturnToken(
        businessId,
        "business",
        actualFingerprint
      );

      let adminData = res.locals.adminData;
      const subject = "Verify Your Email - " + adminData.site_name;
      const templateData = {
        username: cleanedData.full_name, // Pass username
        otp: cleanedData.otp, // Pass OTP
        adminData
      };

      const result = await helpers.sendEmail(
        cleanedData.email,
        subject,
        "email-verify",
        templateData
      );

      this.sendSuccess(
        res,
        {
          mem_type: mem_type,
          authToken: token
        },
        "Business account registered successfully."
      );
    } catch (error) {
      return res.status(500).json({
        status: 0,
        msg: "An error occurred during registration.",
        error: error.message
      });
    }
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
        fingerprint,
        google_id,
        user_image
      } = req.body;

      const mem_type = "user";

      // Clean and trim data
      let cleanedData = {
        full_name: typeof full_name === "string" ? full_name.trim() : "",
        email: typeof email === "string" ? email.trim().toLowerCase() : "",
        password: typeof password === "string" ? password.trim() : "",
        confirm_password:
          typeof confirm_password === "string" ? confirm_password.trim() : "",
        created_at: new Date(),
        mem_status: 1,
        mem_verified: mem_verified || 0,
        mem_phone_verified:0,
        mem_type: mem_type
      };
      if(google_id){
        cleanedData={...cleanedData,google_id:google_id,mem_verified:1, mem_status:1}
      }
      if(user_image){
        const imageName = await helpers.uploadImageFromUrl(user_image);
        if(imageName?.imageName){
          cleanedData={...cleanedData,mem_image:imageName?.imageName}
        }
        
      }

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
      if (!validatePassword(cleanedData.password)) {
        return res.status(200).json({
          status: 0,
          msg: "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one digit, and one special character."
        });
      }

      // Email validation
      if (!validateEmail(cleanedData.email)) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid email format." });
      }

      // Check if email already exists
      const existingUser = await this.member.findByEmail(cleanedData.email);
      if (existingUser) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email already exists." });
      }

      // Hash the password
      cleanedData.password = await bcrypt.hash(cleanedData.password, 10);

      // Remove `confirm_password` as it is not needed in the database
      delete cleanedData.confirm_password;

      if(!google_id){
          let otp = Math.floor(100000 + Math.random() * 900000); 
          cleanedData.otp = parseInt(otp, 10); // Add OTP to cleanedData
          cleanedData.expire_time = moment()
          .add(3, "minutes")
          .format("YYYY-MM-DD HH:mm:ss");
      }
      

      // Create a customer in Stripe
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Initialize Stripe with your secret key
      const customer = await stripe.customers.create({
        name: cleanedData.full_name,
        email: cleanedData.email
      });

      if (!customer || !customer.id) {
        return res
          .status(200)
          .json({ status: 0, msg: "Failed to create customer in Stripe." });
      }

      // Add Stripe customer ID to cleanedData
      cleanedData.customer_id = customer.id;

      // Create the user
      const userId = await this.member.createMember(cleanedData);

      // If fingerprint is not provided, generate a pseudo-fingerprint
      const actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req);

      const token = await this.storeAndReturnToken(
        userId,
        "user",
        actualFingerprint
      );
      if(!google_id){
        let adminData = res.locals.adminData;
        const subject = "Verify Your Email - " + adminData.site_name;
        const templateData = {
          username: cleanedData.full_name, // Pass username
          otp: cleanedData.otp, // Pass OTP
          adminData
        };

        const result = await helpers.sendEmail(
          cleanedData.email,
          subject,
          "email-verify",
          templateData
        );
      }
      
      this.sendSuccess(
        res,
        { mem_type: mem_type, authToken: token, customer_id: customer.id,google_account_status:google_id ? 1 : 0 },
        "User registered successfully."
      );
    } catch (error) {
      return res.status(500).json({
        status: 0,
        msg: "An error occurred during registration.",
        error: error.message
      });
    }
  }

  async loginUser(req, res) {
    try {
      let { email, password, fingerprint, memType ,googleId} = req.body;

      // Clean and trim data
      email = typeof email === "string" ? email.trim().toLowerCase() : "";
      password = typeof password === "string" ? password.trim() : "";
      if(googleId){
        if (!validateRequiredFields({ email, googleId })) {
          return res
            .status(200)
            .json({ status: 0, msg: "Email and password are required." });
        }
      }
      else{
        if (!validateRequiredFields({ email, password })) {
          return res
            .status(200)
            .json({ status: 0, msg: "Email and password are required." });
        }
      }
      // Validate required fields
      

      // Email validation
      if (!validateEmail(email)) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid email format." });
      }
      let existingUser = await this.member.findByEmail(email);

      // Check if the rider exists by email
      if (!existingUser) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email or password is incorrect." });
      }
      if(parseInt(existingUser?.mem_status)!==1){
        return res
          .status(200)
          .json({ status: 0, msg: "Your account is blocked by admin, please contact admin for further details." });
      }
      if(googleId){
        if(existingUser?.google_id!==googleId){
          return res
              .status(200)
              .json({ status: 0, msg: "Your account does not associated with google account, please use password to login." });
        }
      }
      else{
          const passwordMatch = await bcrypt.compare(
            password,
            existingUser.password
          );
          if (!passwordMatch) {
            return res
              .status(200)
              .json({ status: 0, msg: "Email or password is incorrect." });
          }
      }
      // Compare the provided password with the hashed password
      
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req);
      const token = await this.storeAndReturnToken(
        existingUser.id,
        existingUser?.mem_type,
        actualFingerprint
      );

      // Send success response
      this.sendSuccess(
        res,
        { mem_type: existingUser?.mem_type, authToken: token },
        "Successfully logged in."
      );
    } catch (error) {
      return res.status(200).json({
        status: 0,
        msg: "An error occurred during login.",
        error: error.message
      });
    }
  }

  async ResendOtp(req, res) {
    try {
      const { token, memType } = req.body;
      // console.log("Request body:", req.body);
        // console.log("🚀 ResendOtp function triggered"); // Debugging log
    

      // Validate the token and memType
      if (!token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Token and memType are required." });
      }

      // Validate token and get user
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );
      // console.log("✅ Validation Response:", validationResponse);


      if (validationResponse.status === 0) {
        // If the token is invalid, return the validation error message
        return res.status(200).json(validationResponse);
      }
      const user = validationResponse.user;
      // console.log("👤 User Data:", user);





      // Generate a new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
      const newExpireTime = new Date();
      newExpireTime.setMinutes(newExpireTime.getMinutes() + 3); // Set expire time to 3 minutes from now

      // console.log("Generated OTP:", newOtp, "Expire Time:", newExpireTime);

      // Update the OTP and expiry time based on memType
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(user.id, {
          otp: newOtp,
          expire_time: newExpireTime
        });
        let adminData = res.locals.adminData;
      const subject = "Verify Your Email - " + adminData.site_name;
      const templateData = {
        username: user.full_name, // Pass username
        otp: newOtp, // Pass OTP
        adminData
      };
      // console.log("Admin Data:", res.locals.adminData);


//       console.log("Sending email to:", user.email);
// console.log("Email Subject:", subject);
// console.log("Template Data:", templateData);

      const result = await helpers.sendEmail(
        user.email,
        subject,
        "email-verify",
        templateData
      );
      // console.log("Email Result:", result);
        return res.status(200).json({
          status: 1,
          msg: "New OTP generated successfully.",
          expire_time: newExpireTime
        });
      } else if (memType === "rider") {
        await this.rider.updateRiderData(user.id, {
          otp: newOtp,
          expire_time: newExpireTime
        });
        let adminData = res.locals.adminData;
      const subject = "Verify Your Email - " + adminData.site_name;
      const templateData = {
        username: user.full_name, // Pass username
        otp: newOtp, // Pass OTP
        adminData
      };
      console.log("Admin Data:", res.locals.adminData);


      console.log("Sending email to:", user.email);
console.log("Email Subject:", subject);
console.log("Template Data:", templateData);

      const result = await helpers.sendEmail(
        user.email,
        subject,
        "email-verify",
        templateData
      );
      console.log("Email Result:", result);
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid memType provided." });
      }
      

      return res.status(200).json({
        status: 1,
        msg: "New OTP generated successfully.",
        expire_time: newExpireTime
      });

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
      const { token, reason, memType } = req.body;
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const member = userResponse.user;

      // Generate a new OTP

      if(memType==='rider'){
          await this.rider.updateRiderData(member.id, {
            deactivated_reason: reason,
            is_deactivated: 1
          });
      }
      else{
        await this.member.updateMemberData(member.id, {
          deactivated_reason: reason,
          is_deactivated: 1
        });
      }
      
      const adminData = res.locals.adminData;
      const subject = `Email Has Been Deactivated - ${adminData.site_name}`;
      
      const templateData = {
        username: member.full_name, // Pass username
        adminData,
        reason
      };
      const result = await helpers.sendEmail(
          member.email,
          subject,
          "email-deactivated",
          templateData,
        );
      // Respond with the new OTP's expiry time
      return res.status(200).json({
        status: 1,
        msg: "Account Deactivated successfully!"
      });
    } catch (error) {
      // Server error handling
      console.error("Error:", error);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while generating a new OTP.",
        error: error.message
      });
    }
  }

  // API to verify OTP, generate a reset token, and store it
  async verifyOtpAndGenerateToken(req, res) {
    try {
      const { otp, fingerprint, token, mem_type } = req.body;
      // Validate input
      if (!otp) {
        return res.status(200).json({ status: 0, msg: "OTP is required." });
      }
      if (!token) {
        return res
          .status(200)
          .json({ status: 0, msg: "Session is expired.", expired: 1 });
      }

      // Clean the OTP data
      const cleanedOtp = parseInt(otp);
      const userResponse = await this.validateTokenAndGetMember(
        token,
        mem_type
      );

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const memberData = userResponse.user;
      // Check if the OTP exists in the database and get the member
      // const existingMember = await this.member.findByOtp(cleanedOtp);  // Assuming you have a method findByOtp

      // if (!existingMember) {
      //     return res.status(200).json({
      //         status: 0,
      //         msg: 'OTP does not exist in the system.',
      //     });
      // }

      // Validate OTP from the database
      console.log(cleanedOtp,memberData.otp)
      if (parseInt(memberData.otp) !== cleanedOtp) {
        return res.status(200).json({
          status: 0,
          msg: "Invalid OTP."
        });
      }
      const currentTime = new Date();
      const expireTime = new Date(memberData.expire_time);

      if (currentTime > expireTime) {
        return res.status(200).json({
          status: 0,
          msg: "OTP has expired. Please request to reset password again.",
          isOtpExpired: 1
        });
      }
      if (mem_type == "rider") {
        await this.rider.updateRiderData(memberData.id, {
          otp: null,
          expire_time: null
        });
      } else {
        await this.member.updateMemberData(memberData.id, {
          otp: null,
          expire_time: null
        });
      }

      // OTP is correct, now generate a reset token
      let userId = memberData?.id;
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req);
      let token_mem_type = memberData?.token_mem_type;
      if (mem_type == "rider") {
        token_mem_type = "rider";
      } else if (mem_type == "user") {
        token_mem_type = "user";
      }
      console.log(token_mem_type, "token_mem_type", mem_type);
      const resetToken = await this.storeAndReturnToken(
        userId,
        token_mem_type,
        actualFingerprint
      );
      return res.status(200).json({
        status: 1,
        resetToken: resetToken,
        mem_type: token_mem_type, // Return the reset token to the frontend
        msg: "OTP verified successfully and reset token generated.",
        expire_time: null
      });
    } catch (error) {
      // Handle any errors
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while verifying OTP and generating reset token.",
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
        return res
          .status(200)
          .json({ success: false, message: "Email not found." });
      }
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req);
      const tokenType = "user";
      const token = await this.storeAndReturnToken(
        member?.id,
        member?.mem_type,
        actualFingerprint
      );

      // Nodemailer setup
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
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
        subject: "Password Reset Request",
        text: `You requested a password reset. Here is your reset token: ${resetToken}\n\nThe token is valid for 1 hour.`
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email."
      });
    } catch (error) {
      return res
        .status(200)
        .json({
          success: false,
          message: "An error occurred.",
          error: error.message
        });
    }
  }
  async forgetPassword(req, res) {
    try {
      const { email, fingerprint, user_type } = req.body;

      // Validate if email is provided
      if (!email) {
        return res.status(200).json({ status: 0, msg: "Email is required." });
      }

      // Clean the email data
      const cleanedEmail = typeof email === "string" ? email.trim() : "";

      // Check if the email exists in the database
      let existingMember = await this.member.findByEmail(cleanedEmail);
      if (user_type === "rider") {
        existingMember = await this.rider.findByEmail(cleanedEmail);
      }
      if (!existingMember) {
        return res.status(200).json({
          status: 0,
          msg: "Email does not exist in the system."
        });
      }

      // Generate a random OTP
      const otp = Math.floor(100000 + Math.random() * 900000); // OTP between 100000 and 999999
      const newExpireTime = new Date();
      newExpireTime.setMinutes(newExpireTime.getMinutes() + 3);
      // Store the OTP in the member record
      existingMember.otp = otp;
      let memType = "";
      if (user_type === "rider") {
        await this.rider.updateRiderData(existingMember.id, {
          otp: otp,
          expire_time: newExpireTime
        });
        memType = "rider";
      } else {
        await this.member.updateMemberData(existingMember.id, {
          otp: otp,
          expire_time: newExpireTime
        });

        memType = existingMember?.mem_type;
      }

      // Send OTP email
      const adminData = res.locals.adminData;
      const subject = `Forget Password Request - ${adminData.site_name}`;
      const templateData = {
          username: existingMember.full_name, // Pass username
          otp, // Pass OTP
          adminData
      };

      await helpers.sendEmail(existingMember.email, subject, "forget-password-email", templateData);

      console.log(memType, "memType");
      const userId = existingMember.id;
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment
      const authToken = await this.storeAndReturnToken(
        userId,
        memType,
        actualFingerprint
      );
      // Send success response
      return res.status(200).json({
        status: 1, // OTP generated successfully
        msg: "An otp is sent to your email.",
        expire_time: newExpireTime,
        authToken: authToken,
        mem_type: memType
      });
    } catch (error) {
      // console.log(error)
      // Handle any errors that occur during the process
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while generating OTP.",
        error: error.message
      });
    }
  }

  resetPassword = async (req, res) => {
    try {
      const {
        token,
        new_password,
        confirm_password,
        fingerprint,
        memType,
        user_type
      } = req.body;

      // Check if all fields are provided
      if (!token || !new_password || !confirm_password) {
        return res.status(200).json({
          status: 0,
          msg: "All fields are required."
        });
      }

      // Validate that the new password and confirm password match
      if (new_password !== confirm_password) {
        return res.status(200).json({
          status: 0,
          msg: "New password and confirm password do not match."
        });
      }

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      let mem_type = memType;
      if (!memType) {
        mem_type = "user";
        if (user_type == "rider") {
          mem_type = "rider";
        }
      } else if (
        user_type !== null &&
        user_type !== "null" &&
        user_type !== ""
      ) {
        mem_type = user_type;
      }
      console.log(mem_type, "mem_type", memType);
      const userResponse = await this.validateTokenAndGetMember(
        token,
        mem_type
      );
      // console.log(userResponse);return;
      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const member = userResponse.user;
      const userId = member?.id;

      // Hash the new password before saving
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update the user's password in the database
      const updatedMemberData = {
        password: hashedPassword
      };
      if (mem_type == "rider") {
        await this.rider.updateRiderData(userId, updatedMemberData);
      } else {
        await this.member.updateMemberData(userId, updatedMemberData);
        // Assuming `updateMemberData` is a function that updates the user's data in the DB
      }

      // Optionally, you can regenerate a new token if needed
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment
      const authToken = await this.storeAndReturnToken(
        userId,
        mem_type,
        actualFingerprint
      );

      // Send the success response with the reset token
      return res.status(200).json({
        status: 1,
        msg: "Password updated successfully.",
        authToken: authToken,
        mem_type: mem_type
        // Send the reset token (or use the existing token)
      });
    } catch (error) {
      console.error("Error changing password:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message
      });
    }
  };

  async verifyEmail(req, res) {
    try {
      const { token, otp, memType } = req.body;

      // Validate required fields
      if (!token || !otp) {
        return res
          .status(200)
          .json({ success: false, message: "Token and OTP are required." }); // Changed to 400 for bad request
      }
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const user = userResponse.user;
      const storedOtp = parseInt(user.otp, 10); // Parse stored OTP as an integer (base 10)
      const providedOtp = parseInt(otp, 10);
      if (storedOtp !== providedOtp) {
        return res.status(200).json({ status: 0, msg: "Incorrect OTP." }); // Changed to 400 for incorrect OTP
      }
      const currentTime = new Date();
      const expireTime = new Date(user.expire_time);

      if (currentTime > expireTime) {
        return res.status(200).json({
          status: 0,
          msg: "OTP has expired. Please generate a new OTP."
        });
      }
      if (memType === "rider") {
        await this.rider.updateRiderVerification(user.id);
      } else if (memType === "user" || memType === "business") {
        await this.member.updateMemberVerification(user.id);
      }

      return res
        .status(200)
        .json({ status: 1, msg: "Email verified successfully." });
    } catch (error) {
      // Server error handling
      return res.status(200).json({
        success: false,
        message: "An error occurred during email verification.",
        error: error.message
      });
    }
  }

  async UpdateEmailAddress(req, res) {
    try {
      const { email, token, memType } = req.body;
      // console.log("Request body:", req.body);

      // Validate the token and memType
      if (!email || !token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email, Token and memType are required." });
      }

      // Validate token and get user
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );

      if (validationResponse.status === 0) {
        // If the token is invalid, return the validation error message
        return res.status(200).json(validationResponse);
      }

      const user = validationResponse.user;
      let adminData = res.locals.adminData;
      const subject = "Confirm Your Email Change Request - " + adminData.site_name;
      let otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
      otp = parseInt(otp, 10); // Add OTP to cleanedData
      const newExpireTime = new Date();
      newExpireTime.setMinutes(newExpireTime.getMinutes() + 3);
      const templateData = {
        username: user.full_name, // Pass username
        otp: otp, // Pass OTP
        adminData
      };

      
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(user.id, {
          temp_email: email,
          otp: otp,
          expire_time: newExpireTime
        });
        const result = await helpers.sendEmail(
          user.email,
          subject,
          "email-user-request",
          templateData
        );
      } else if (memType === "rider") {
        await this.rider.updateRiderData(user.id, {
          temp_email: email,
          otp: otp,
          expire_time: newExpireTime
        });
        const result = await helpers.sendEmail(
          user.email,
          subject,
          "email-user-request",
          templateData
        );
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid memType provided." });
      }

      // Respond with OTP expiry time
      return res.status(200).json({
        status: 1,
        msg: "Email request sent to your current email successfully.",
        expire_time:newExpireTime
      });
    } catch (error) {
      // Server error handling
      console.error("Error in updating email address:", error.message);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while updating email address.",
        error: error.message
      });
    }
  }
  async VerifyUpdateEmailAddress(req, res) {
    try {
      const { otp, token, memType } = req.body;
      // console.log("Request body:", req.body);

      // Validate the token and memType
      if (!otp || !token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email, Token and memType are required." });
      }

      // Validate token and get user
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );

      if (validationResponse.status === 0) {
        // If the token is invalid, return the validation error message
        return res.status(200).json(validationResponse);
      }

      const user = validationResponse.user;

      const cleanedOtp = parseInt(otp);
      if (parseInt(user.otp) !== cleanedOtp) {
        return res.status(200).json({
          status: 0,
          msg: "Invalid OTP."
        });
      }
      const currentTime = new Date();
      const expireTime = new Date(user.expire_time);

      if (currentTime > expireTime) {
        return res.status(200).json({
          status: 0,
          msg: "OTP has expired. Please request to change email again.",
          isOtpExpired: 1
        });
      }




      let adminData = res.locals.adminData;
      const subject = "Verify Your New Email Address - " + adminData.site_name;
      let new_otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
      new_otp = parseInt(new_otp, 10); // Add OTP to cleanedData
      const newExpireTime = new Date();
      newExpireTime.setMinutes(newExpireTime.getMinutes() + 3);
      const templateData = {
        username: user.full_name, // Pass username
        otp: new_otp, // Pass OTP
        adminData
      };

      
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(user.id, {
          otp: new_otp,
          expire_time: newExpireTime
        });
        const result = await helpers.sendEmail(
          user.temp_email,
          subject,
          "email-new-user-request",
          templateData
        );
      } else if (memType === "rider") {
        await this.rider.updateRiderData(user.id, {
          otp: new_otp,
          expire_time: newExpireTime
        });
        const result = await helpers.sendEmail(
          user.temp_email,
          subject,
          "email-new-user-request",
          templateData
        );
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid memType provided." });
      }

      // Respond with OTP expiry time
      return res.status(200).json({
        status: 1,
        msg: "Email sent to your new email. Please verify to update email address.",
        expire_time:newExpireTime
      });
    } catch (error) {
      // Server error handling
      console.error("Error in updating email address:", error.message);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while updating email address.",
        error: error.message
      });
    }
  }
  async FinishVerifyUpdateEmailAddress(req, res) {
    try {
      const { otp, token, memType } = req.body;
      // console.log("Request body:", req.body);

      // Validate the token and memType
      if (!otp || !token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email, Token and memType are required." });
      }

      // Validate token and get user
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );

      if (validationResponse.status === 0) {
        // If the token is invalid, return the validation error message
        return res.status(200).json(validationResponse);
      }

      const user = validationResponse.user;

      const cleanedOtp = parseInt(otp);
      if (parseInt(user.otp) !== cleanedOtp) {
        return res.status(200).json({
          status: 0,
          msg: "Invalid OTP."
        });
      }
      const currentTime = new Date();
      const expireTime = new Date(user.expire_time);

      if (currentTime > expireTime) {
        return res.status(200).json({
          status: 0,
          msg: "OTP has expired. Please request to change email again.",
          isOtpExpired: 1
        });
      }




      let adminData = res.locals.adminData;
      const subject = "Email is changed - " + adminData.site_name;
      
      const templateData = {
        username: user.full_name, // Pass username
        adminData
      };

      
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(user.id, {
          otp: null,
          expire_time: null,
          temp_email:null,
          email:user.temp_email
        });
        const result = await helpers.sendEmail(
          user.temp_email,
          subject,
          "email-changed",
          templateData
        );
      } else if (memType === "rider") {
        await this.rider.updateRiderData(user.id, {
          otp: null,
          expire_time: null,
          temp_email:null,
          email:user.temp_email
        });
        const result = await helpers.sendEmail(
          user.temp_email,
          subject,
          "email-changed",
          templateData
        );
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid memType provided." });
      }

      // Respond with OTP expiry time
      return res.status(200).json({
        status: 1,
        msg: "Email updated successfully",
        // expire_time:newExpireTime
      });
    } catch (error) {
      // Server error handling
      console.error("Error in updating email address:", error.message);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while updating email address.",
        error: error.message
      });
    }
  }
}

module.exports = MemberController;
