// controllers/HomeController.js
const axios = require("axios");

const BaseController = require("../baseController");
const PageModel = require("../../models/api/pages"); // Assuming you have this model
const MemberModel = require("../../models/memberModel");
const Token = require("../../models/tokenModel");

const TestimonialModel = require("../../models/api/testimonialModel");
const TeamModel = require("../../models/api/teamModel");
const FaqModel = require("../../models/api/faqModel");
const VehicleModel = require("../../models/api/vehicleModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const jwt = require("jsonwebtoken"); // Make sure to require the jwt package
const moment = require("moment");

const HERE_API_KEY = process.env.HERE_API_KEY;
const express = require("express");
const router = express.Router();

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use your actual API key

const pool = require("../../config/db-connection");
const {
  validateFields,
  validateRequiredFields,
  validateSignUPRequiredFields,
  validateEmail,
  validatePassword,
} = require("../../utils/validators");
const helpers = require("../../utils/helpers");

class PagesController extends BaseController {
  constructor() {
    super();
    this.pageModel = new PageModel();
    this.tokenModel = new Token();
    this.memberModel = new MemberModel(); // Create an instance of MemberModel
  }
  async getHomeData(req, res) {
    const testimonialModel = new TestimonialModel();

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("home");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Get testimonials data
      const testimonialsData = await testimonialModel.findFeatured();

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        testimonials: testimonialsData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async getAboutData(req, res) {
    const teamModel = new TeamModel();

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("about");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Get testimonials data
      const teamData = await teamModel.findFeatured();

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        teamMembers: teamData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getContactData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("contact");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getPrivacyPolicyData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("privacy-policy");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getTermsConditionsData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("terms-conditions");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getHelpSupportData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("help-support");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getFaqData(req, res) {
    const faqModel = new FaqModel();

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("faq");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      const faqsData = await faqModel.findFeatured();

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
        faqs: faqsData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getLoginData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("login");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getForgotPasswordData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("forgot-password");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  async getSignUpData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("sign-up");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  async getResetPasswordData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("reset-password");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  async getBusinessData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("business");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }
  async getRiderData(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const pageContent = await this.pageModel.findByKey("rider");
      const formData = pageContent
        ? JSON.parse(pageContent.content || "{}")
        : {};

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        content: formData,
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async requestQuote(req, res) {
    const vehicleModel = new VehicleModel();
    const { token } = req.body;

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const vehiclesData = await vehicleModel.findFeatured();

      // Initialize member as null by default
      let member = null;
      console.log(token, 'token')
      // If a token is provided, decrypt it and fetch user details
      if (token !== undefined && token !== null && token !== '' && token !== 'null') {
        let decryptedToken;
        try {
          decryptedToken = helpers.decryptToken(token); // Assuming decryptToken is a function that decrypts the token
        } catch (err) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid or corrupted token." });
        }

        // Validate token format and extract userId
        const parts = decryptedToken.split("-");
        if (parts.length < 3) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid token format." });
        }

        const userId = parts[2]; // Extract userId from the token

        // Check if member exists
        member = await this.memberModel.findById(userId);
        if (!member) {
          return res.status(200).json({ status: 0, msg: "Member not found." });
        }
      }

      // Combine the content and multi_text data
      const jsonResponse = {
        siteSettings,
        vehicles: vehiclesData,
        member, // This will be null if no token was provided
      };

      // Return data in JSON format
      res.json(jsonResponse);
    } catch (err) {
      console.error("Error:", err);
      res.status(200).json({ error: "Internal Server Error" });
    }
  }

  async getAddress(req, res) {
    console.log(req.body); // Log the body to check if it's coming through correctly

    const { zip_code } = req.body;

    if (!zip_code) {
      return res.status(200).json({ error: "Zip code is required" });
    }

    try {
      // Make request to HERE API to get addresses for the given zip code
      const hereResponse = await axios.get(
        `https://geocode.search.hereapi.com/v1/geocode`,
        {
          params: {
            q: zip_code,
            apiKey: HERE_API_KEY,
          },
        }
      );

      // Extract relevant data
      const addresses = hereResponse.data.items.map((item) => ({
        address: item.address.label,
        city: item.address.city,
      }));

      res.json({ addresses });
    } catch (error) {
      console.error("Error fetching data from HERE API:", error.message);
      res
        .status(200)
        .json({ error: "An error occurred while fetching addresses" });
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
        fingerprint, // Keep fingerprint as a parameter
      } = req.body;
      console.log(req.body);

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
      };
      console.log(cleanedData);

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
      const existingUser = await this.memberModel.findByEmail(
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
      const userId = await this.memberModel.createMember(cleanedData);
      console.log("Created user ID:", userId); // Log the created rider ID

      // Verify OTP was stored properly
      const createdUser = await this.memberModel.findById(userId);
      console.log("Created User:", createdUser); // Log the created rider

      // console.log('Stored OTP after creation:', createdRider.otp);

      // If fingerprint is not provided, generate a pseudo-fingerprint
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

      // Store the token in the tokens table
      await this.tokenModel.storeToken(
        userId,
        token,
        tokenType,
        expiryDate,
        actualFingerprint
      );

      this.sendSuccess(
        res,
        { mem_type: "user", authToken: token },
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

  generatePseudoFingerprint(req) {
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.ip || "";
    const acceptHeader = req.headers["accept"] || "";
    const combined = `${userAgent}:${ipAddress}:${acceptHeader}`;

    // Create a hash of the combined string for uniqueness
    return crypto.createHash("sha256").update(combined).digest("hex");
  }
  async loginUser(req, res) {
    try {
      let { email, password } = req.body;

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

      // Check if the rider exists by email
      const existingUser = await this.memberModel.findByEmail(email);
      if (!existingUser) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email or password is incorrect." });
      }

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

      // Generate a random number and create the token
      const randomNum = crypto.randomBytes(16).toString("hex");
      const tokenType = "user";
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

      // Create the token
      const token = helpers.generateToken(
        `${existingUser.id}-${randomNum}-${tokenType}`
      );

      // Store the token in the tokens table (optional, based on your implementation)
      await this.tokenModel.storeToken(
        existingUser.id,
        token,
        tokenType,
        expiryDate
      );

      // Send success response
      this.sendSuccess(
        res,
        { mem_type: existingUser.mem_type, authToken: token },
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

  async verifyEmail(req, res) {
    try {
      const { token, otp } = req.body;
      console.log(req.body);

      if (!token || !otp) {
        return res
          .status(200)
          .json({ status: 0, msg: "Token and OTP are required." });
      }

      const storedToken = await this.tokenModel.findByToken(token);
      console.log("Token query result:", storedToken);

      const userId = Array.isArray(storedToken)
        ? storedToken[0]?.user_id
        : storedToken?.user_id;

      if (!userId) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid or expired token." });
      }

      console.log("User ID:", userId);

      const user = await this.memberModel.findById(userId);
      console.log("User:", user);

      if (!user || user.length === 0) {
        return res.status(200).json({ status: 0, msg: "User not found." });
      }
      const currentTime = new Date();
      const expireTime = new Date(user.expire_time);

      if (currentTime > expireTime) {
        return res.status(200).json({
          status: 0,
          msg: "OTP has expired. Please generate a new OTP.",
        });
      }
      const storedOtp = parseInt(user.otp, 10);
      const providedOtp = parseInt(otp, 10);

      if (storedOtp !== providedOtp) {
        return res.status(200).json({ status: 0, msg: "Incorrect OTP." });
      }

      await this.memberModel.updateMemberVerification(user.id);

      return res
        .status(200)
        .json({ status: 1, msg: "Email verified successfully." });
    } catch (error) {
      console.error("Error during email verification:", error);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred during email verification.",
        error: error.message,
      });
    }
  }

  async getMemberFromToken(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // Decrypt the token
      let decryptedToken;
      try {
        decryptedToken = helpers.decryptToken(token);
      } catch (err) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid or corrupted token." });
      }
      const parts = decryptedToken.split("-");
      if (parts.length < 3) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid token format." });
      }

      const userId = parts[2]; // Extract userId
      const member = await this.memberModel.findById(userId);
      if (!member) {
        return res.status(404).json({ status: 0, msg: "Member not found." });
      }

      return res.status(200).json({
        status: 1,
        member,
      });
    } catch (error) {
      console.error("Error in getMemberFromToken:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "An error occurred while processing the request.",
        error: error.message,
      });
    }
  }

  // API Endpoint to Upload Profile Picture
  // app.post('/upload-profile-pic', verifyToken, upload.single('file'), async (req, res) => {
  // Route to handle image upload
  uploadProfileImage = async (req, res) => {
    try {
      const { token } = req.body; // Assuming token is sent in the request body
      console.log(token);
      let decryptedToken;
      try {
        decryptedToken = helpers.decryptToken(token);
      } catch (err) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid or corrupted token." });
      }

      //   // Validate token format and extract userId
      const parts = decryptedToken.split("-");
      if (parts.length < 3) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid token format." });
      }

      const userId = parts[2]; // Extract userId from the token

      //   // Check if member exists
      const member = await this.memberModel.findById(userId);
      if (!member) {
        return res.status(200).json({ status: 0, msg: "Member not found." });
      }
      if (!req.file) {
        return res.status(200).json({ status: 0, msg: "No file uploaded." });
      }

      // Get the uploaded file
      const memImage = req.file.filename;

      // Construct the file path
      const imageUrl = `${memImage}`;

      // Update the member's profile image in the database
      await this.memberModel.updateMemberData(member.id, {
        mem_image: imageUrl,
      });

      // Send response including token, file object, and image URL
      return res.status(200).json({
        status: 1,
        msg: "Image uploaded successfully.",
        mem_image: imageUrl,
        token: decryptedToken,
        file: req.file, // File metadata from multer
      });
    } catch (error) {
      console.error("Error uploading profile image:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  };

  updateProfile = async (req, res) => {
    try {
      const { token, first_name, last_name, mem_phone, address, bio } =
        req.body; // Assuming token and user data are sent in the request body

      // If no token is provided
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // Verify token and extract user information
      let decryptedToken;
      try {
        decryptedToken = helpers.decryptToken(token); // Assuming decryptToken is a function that decrypts the token
      } catch (err) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid or corrupted token." });
      }

      // Validate token format and extract userId
      const parts = decryptedToken.split("-");
      if (parts.length < 3) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid token format." });
      }

      const userId = parts[2]; // Extract userId from the token

      // Check if member exists
      const member = await this.memberModel.findById(userId);
      if (!member) {
        return res.status(200).json({ status: 0, msg: "Member not found." });
      }

      // Validate the fields
      if (!first_name || !last_name || !mem_phone || !address) {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "First name, last name, phone number, and address are required.",
          });
      }

      // Save the updated member data
      const updatedMemberData = {
        full_name: first_name + " " + last_name,
        mem_phone,
        mem_address1: address,
        mem_bio: bio || "", // If bio is provided, use it; otherwise, set it to an empty string
      };

      await this.memberModel.updateMemberData(userId, updatedMemberData); // Assuming `updateMemberData` is a function that updates the user's data in the DB

      // Send a success response
      return res
        .status(200)
        .json({
          status: 1,
          msg: "Profile updated successfully.",
          mem_name: first_name + " " + last_name,
        });
    } catch (error) {
      console.error("Error updating profile:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  };

  changePassword = async (req, res) => {
    try {
      const { token, current_password, new_password, confirm_password } =
        req.body;

      // Check if all fields are provided
      if (!token || !current_password || !new_password || !confirm_password) {
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
      const member = await this.memberModel.findById(userId);
      if (!member) {
        return res.status(404).json({
          status: 0,
          msg: "User not found.",
        });
      }

      // Check if the current password matches the one in the database
      const isCurrentPasswordValid = await bcrypt.compare(
        current_password,
        member.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(200).json({
          status: 0,
          msg: "Current password is incorrect.",
        });
      }

      // Hash the new password before saving
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update the user's password in the database
      // Prepare updated data object
      const updatedMemberData = {
        password: hashedPassword,
      };
      await this.memberModel.updateMemberData(userId, updatedMemberData); // Assuming `updateMemberData` is a function that updates the user's data in the DB

      return res.status(200).json({
        status: 1,
        msg: "Password updated successfully.",
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

  generatePseudoFingerprint(req) {
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.ip || "";
    const acceptHeader = req.headers["accept"] || "";
    const combined = `${userAgent}:${ipAddress}:${acceptHeader}`;

    // Create a hash of the combined string for uniqueness
    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  async paymentIntent(req, res) {
    const {
      selectedVehicle,
      vehiclePrice,
      source_postcode,
      source_address,
      source_name,
      source_phone_number,
      source_city,
      dest_postcode,
      dest_address,
      dest_name,
      dest_phone_number,
      dest_city,
      source_full_address,
      dest_full_address,
      charge_agreement,
      full_name,
      email,
      password,
      confirm_password,
      card_holder_name,
      confirm,
      totalAmount,
      payment_method,
      payment_method_id,
      fingerprint,
      token,
    } = req.body;

    console.log(req.body);

    const requiredFields = [
      "selectedVehicle",
      "vehiclePrice",
      "source_postcode",
      "source_address",
      "source_name",
      "source_phone_number",
      "source_city",
      "dest_postcode",
      "dest_address",
      "dest_name",
      "dest_phone_number",
      "dest_city",
      "source_full_address",
      "dest_full_address",
      "charge_agreement",
      "card_holder_name",
      "confirm",
      "totalAmount",
      "payment_method",
      "payment_method_id",
    ];
    // If no token is provided, validate additional fields
    if (!token) {
      requiredFields.push("full_name", "email", "password", "confirm_password");
    }
    console.log(token, 'token')
    // Validate fields
    const { isValid, errors } = validateFields(req.body, requiredFields);
    if (!isValid) {
      return res.status(200).json({
        status: 0,
        msg: "Validation failed",
        errors,
      });
    }

    try {
      let userId;
      let token_arr = {}
      // Handle user authentication/creation
      if (token) {
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

        const mem_id = parts[2]; // Extract user ID from the token

        // Get the user from the database
        const member = await this.memberModel.findById(mem_id);
        if (!member) {
          return res
            .status(200)
            .json({ error: "Invalid token or user not found" });
        }
        userId = member.id;
      } else {
        // Check email validity
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
          return res.status(200).json({ error: "Invalid email format." });
        }

        // Check password match
        if (password !== confirm_password) {
          return res
            .status(200)
            .json({ success: false, message: "Passwords do not match." });
        }

        // Check if user already exists
        const userExist = await this.memberModel.emailExists(email);
        if (userExist) {
          return res
            .status(200)
            .json({ error: "User already exists! Please login to continue!" });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000);
        userId = await this.memberModel.createMember({
          full_name,
          email,
          mem_type: "user",
          password: hashedPassword,
          mem_status: 1,
          created_at: helpers.create_current_date(),
          otp,
        });

        console.log("User created with ID:", userId);
      }

      // Generate token for user if not provided
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
      if (!token) {
        await this.tokenModel.storeToken(
          userId,
          authToken,
          tokenType,
          expiryDate,
          actualFingerprint,
          "user"
        );
        console.log("Token stored for user:", userId);
        token_arr = { authToken, type: "user" }
      }

      // Handle payment logic
      const parsedAmount = parseFloat(totalAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res
          .status(200)
          .json({ error: "Amount must be a positive number." });
      }

      // Create customer on Stripe
      const stripeCustomer = await stripe.customers.create({
        name: full_name,
        email: email,
      });

      // Retrieve payment method
      const paymentMethod = await stripe.paymentMethods.retrieve(
        payment_method_id
      );

      // Create payment intent
      const amountInCents = Math.round(parsedAmount * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        payment_method: payment_method_id,
        customer: stripeCustomer.id,
        setup_future_usage: "off_session",
      });

      // Respond with payment details
      return res.status(200).json({
        status: 1,
        user_id: userId,
        customer_id: stripeCustomer.id,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        authToken: token_arr?.authToken,
        mem_type: token_arr?.type,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return res
        .status(500)
        .json({
          status: 0,
          message: "Failed to create payment intent",
          error: error.message,
        });
    }
  }

  async createRequestQuote(req, res) {
    this.tokenModel = new Token();

    try {
      // Destructure necessary fields from req.body
      const {
        token,
        payment_intent_customer_id,
        selectedVehicle,
        vehiclePrice,
        totalAmount,
        parcels,
        source_postcode,
        source_full_address,
        source_name,
        source_phone_number,
        source_city,
        dest_postcode,
        dest_full_address,
        dest_name,
        dest_phone_number,
        dest_city,
        payment_method,
        payment_method_id,
      } = req.body;

      if (token) {
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
          return res.status(200).json({
            status: 0,
            msg: "Invalid token format.",
          });
        }

        const mem_id = parts[2]; // Extract user ID from the token

        // Get the user from the database
        const member = await this.memberModel.findById(mem_id);
        if (!member) {
          return res.status(200).json({ error: "Invalid token or user not found" });
        }

        // Now you have the user (member) and their ID, use member.id instead of user.id
        const userId = member.id;
        let parcelsArr = []
        if (parcels) {
          parcelsArr = JSON.parse(parcels)
        }
        console.log(parcelsArr)
        // Validate parcels
        if (!Array.isArray(parcelsArr)) {
          return res.status(200).json({ status: 0, msg: "'parcels' must be an array" });
        }

        // Create Request Quote record
        const requestQuoteId = await this.pageModel.createRequestQuote({
          user_id: userId,  // Save the userId in the request
          selected_vehicle: selectedVehicle,
          vehicle_price: vehiclePrice,
          total_amount: totalAmount,
          payment_intent: payment_intent_customer_id,
          customer_id: payment_intent_customer_id,
          source_postcode,
          source_address: source_full_address,
          source_name,
          source_phone_number,
          source_city,
          dest_postcode,
          dest_address: dest_full_address,
          dest_name,
          dest_phone_number,
          dest_city,
          payment_method,
          payment_method_id,
        });

        // Create Parcels records for the request
        const parcelRecords = parcelsArr.map((parcel) => ({
          request_id: requestQuoteId,
          length: parcel.length,
          width: parcel.width,
          height: parcel.height,
          weight: parcel.weight,
          destination: parcel.destination,
          source: parcel.source,
          parcelNumber: parcel.parcelNumber,
          distance: parcel.distance,
          parcelType: parcel.parcelType,
        }));

        // Insert parcels into the database
        await this.pageModel.insertParcels(parcelRecords);

        // Send success response
        res.status(200).json({
          status: 1,
          msg: "Request Quote and Parcels created successfully",
        });
      } else {
        return res.status(200).json({
          error: "Token is required",
        });
      }
    } catch (error) {
      console.error("Error in createRequestQuote:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
}

module.exports = PagesController;
