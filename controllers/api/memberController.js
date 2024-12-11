// controllers/api/RiderController.js
const BaseController = require("../baseController");
const Member = require("../../models/memberModel");
const Rider = require("../../models/riderModel");
const VehicleModel = require("../../models/api/vehicleModel");
const PageModel = require("../../models/api/pages"); // Assuming you have this model
const PaymentMethodModel = require("../../models/api/paymentMethodModel"); // Assuming you have this model

const Token = require("../../models/tokenModel");
const Addresses = require("../../models/api/addressModel");
const {
  validateEmail,
  validatePhoneNumber,
  validateRequiredFields,
  validateFields,
} = require("../../utils/validators");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const helpers = require("../../utils/helpers");
const { SMTP_MAIL, SMTP_PASSWORD } = process.env;
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
class MemberController extends BaseController {
  constructor() {
    super();
    this.member = new Member();
    this.rider = new Rider();
    this.pageModel = new PageModel();
    this.tokenModel = new Token();
    this.addressModel = new Addresses();
    this.paymentMethodModel = new PaymentMethodModel();
  }

  async getAddresses(req, res) {
    try {
      const { token, memType } = req.body;
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const member = userResponse.user;
      const userId = member?.id;

      // Fetch all addresses associated with the user
      const addresses = await this.addressModel.getAddressesByUserId(userId);
      // console.log(addresses)
      // Return the array of addresses
      return res.status(200).json({
        status: 1,
        addresses: addresses?.length <= 0 ? [] : addresses,
      });
    } catch (error) {
      console.error("Error fetching addresses:", error.message);
      return res.status(200).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  }

  async getAndInsertAddress(req, res) {
    try {
      const {
        token,
        first_name,
        last_name,
        phone_number,
        address,
        post_code,
        city,
        memType,
      } = req.body;
      // console.log(memType)

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      // console.log(userResponse)

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const member = userResponse.user;
      const userId = member?.id;

      // Validate input data
      if (
        !first_name ||
        !last_name ||
        !phone_number ||
        !address ||
        !city ||
        !post_code
      ) {
        return res.status(400).json({
          status: 0,
          msg: "Address  city, and postcode are required.",
        });
      }

      // Check if user already has addresses
      const existingAddresses = await this.addressModel.getAddressesByUserId(
        userId
      );

      // Determine default value
      const isDefault = existingAddresses.length === 0 ? 1 : 0;

      // Insert the address into the database
      const newAddress = {
        mem_id: userId,
        first_name,
        last_name,
        phone_number,
        address,
        post_code,
        city,
        default: isDefault,
      };
      // console.log(newAddress)
      const insertedAddress = await this.addressModel.insertAddress(newAddress);

      // Fetch all addresses for the user
      const addresses = await this.addressModel.getAddressesByUserId(userId);

      return res.status(200).json({
        status: 1,
        msg: "Address added successfully.",
        addresses: addresses,
      });
    } catch (error) {
      console.error("Error in getAndInsertAddress:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  }
  async updateAddress(req, res) {
    try {
      const {
        token,
        first_name,
        last_name,
        phone_number,
        address,
        post_code,
        city,
        address_id,
        memType,
      } = req.body;

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
          msg: "Address is required.",
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
      const member = userResponse.user;
      const userId = member?.id;

      // Validate input data
      if (
        !first_name ||
        !last_name ||
        !phone_number ||
        !address ||
        !city ||
        !post_code
      ) {
        return res.status(400).json({
          status: 0,
          msg: "Address  city, and postcode are required.",
        });
      }
      const address_row = await this.addressModel.getAddressById(
        address_id,
        userId
      );
      if (!address_row) {
        return res.status(200).json({
          status: 0,
          msg: "Address is required.",
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
      // console.log(newAddress)
      const insertedAddress = await this.addressModel.updateData(
        address_id,
        newAddress
      );

      // Fetch all addresses for the user
      const addresses = await this.addressModel.getAddressesByUserId(userId);

      return res.status(200).json({
        status: 1,
        msg: "Address updated successfully.",
        addresses: addresses,
      });
    } catch (error) {
      console.error("Error in getAndInsertAddress:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  }
  async deleteAddress(req, res) {
    try {
      const { token, address_id, memType } = req.body;

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
          msg: "Address is required.",
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
      const member = userResponse.user;
      const userId = member.id;

      const address_row = await this.addressModel.getAddressById(
        address_id,
        userId
      );
      if (!address_row) {
        return res.status(200).json({
          status: 0,
          msg: "Address is required.",
        });
      }

      const insertedAddress = await this.addressModel.deleteAddress(address_id);

      // Fetch all addresses for the user
      const addresses = await this.addressModel.getAddressesByUserId(userId);

      return res.status(200).json({
        status: 1,
        msg: "Address deleted successfully.",
        addresses: addresses,
      });
    } catch (error) {
      console.error("Error in getAndInsertAddress:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  }

  async setAsDefaultAddress(req, res) {
    try {
      const { token, address_id, memType } = req.body;

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

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const member = userResponse.user;
      const userId = member?.id;

      // Check if the address exists for the user
      const address_row = await this.addressModel.getAddressById(
        address_id,
        userId
      );
      if (!address_row) {
        return res.status(200).json({
          status: 0,
          msg: "Address not found or does not belong to the user.",
        });
      }

      // Reset default for all addresses
      await this.addressModel.resetDefaultStatusForUser(userId);
      // console.log("All addresses reset to default = 0");

      // Set specific address as default
      const isDefaultSet = await this.addressModel.setAsDefaultAddress(
        address_id
      );
      if (!isDefaultSet) {
        return res.status(500).json({
          status: 0,
          msg: "Failed to set address as default.",
        });
      }
      // console.log(`Address ${address_id} set as default`);

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

  async requestQuote(req, res) {
    const vehicleModel = new VehicleModel();
    const { token, memType } = req.body;

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const vehiclesData = await vehicleModel.findFeatured();

      // Initialize member as null by default
      let member = null;

      // If a token is provided, decrypt it and fetch user details
      if (
        token !== undefined &&
        token !== null &&
        token !== "" &&
        token !== "null"
      ) {
        if (!token) {
          return res.status(200).json({ status: 0, msg: "Token is required." });
        }
        if (memType === "rider") {
          return res
            .status(200)
            .json({ status: 0, msg: "Rider account can not create request!" });
        }
        const userResponse = await this.validateTokenAndGetMember(
          token,
          memType
        );

        if (userResponse.status === 0) {
          // If validation fails, return the error message
          return res.status(200).json(userResponse);
        }
        member = userResponse.user;
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
      memType,
    } = req.body;

    // console.log(req.body); 

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
    // console.log(token, 'token')
    // Validate fields
    const { isValid, errors } = validateFields(req.body, requiredFields);
    if (!isValid) {
      return res.status(200).json({
        status: 0,
        msg: "Validation failed",
        errors,
      });
    }
    console.log(memType)
    try {
      let userId;
      let token_arr = {};
      // Handle user authentication/creation
      if (token) {
        if (!token) {
          return res.status(200).json({ status: 0, msg: "Token is required." });
        }
        if (memType === "rider") {
          return res
            .status(200)
            .json({ status: 0, msg: "Rider account can not create request!" });
        }
        const userResponse = await this.validateTokenAndGetMember(
          token,
          memType
        );

        if (userResponse.status === 0) {
          // If validation fails, return the error message
          return res.status(200).json(userResponse);
        }
        const member = userResponse.user;
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
        const userExist = await this.member.emailExists(email);
        if (userExist) {
          return res
            .status(200)
            .json({ error: "User already exists! Please login to continue!" });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000);
        userId = await this.member.createMember({
          full_name,
          email,
          mem_type: "user",
          password: hashedPassword,
          mem_status: 1,
          created_at: helpers.create_current_date(),
          otp,
        });

        // console.log("User created with ID:", userId);
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
        // console.log("Token stored for user:", userId);
        token_arr = { authToken, type: "user" };
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
      return res.status(500).json({
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
        vias,
        memType,
        date,
        notes
      } = req.body;
      console.log("create request:", req.body);

      if (token) {
        if (!token) {
          return res.status(200).json({ status: 0, msg: "Token is required." });
        }
        if (memType === "rider") {
          return res
            .status(200)
            .json({ status: 0, msg: "Rider account can not create request!" });
        }
        const userResponse = await this.validateTokenAndGetMember(
          token,
          memType
        );

        if (userResponse.status === 0) {
          // If validation fails, return the error message
          return res.status(200).json(userResponse);
        }
        const member = userResponse.user;
        // Now you have the user (member) and their ID, use member.id instead of user.id
        const userId = member.id;
        let parcelsArr = [];
        let viasArr = [];
        if (parcels) {
          parcelsArr = JSON.parse(parcels);
        }
        if (vias) {
          viasArr = JSON.parse(vias);
        }
        // console.log(parcelsArr)
        // Validate parcels
        if (!Array.isArray(parcelsArr)) {
          return res
            .status(200)
            .json({ status: 0, msg: "'parcels' must be an array" });
        }

        const parsedStartDate = date ? new Date(date) : null;
        if (!parsedStartDate || isNaN(parsedStartDate)) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid start_date format" });
        }

        // Create Request Quote record
        const requestQuoteId  = await this.pageModel.createRequestQuote({
          user_id: userId, // Save the userId in the request
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
          created_date: new Date(), // Set current date as created_date
          start_date: parsedStartDate,
          notes: notes
          // Pass start_date from the frontend
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

        const viaRecords = viasArr.map((via) => ({
          request_id: requestQuoteId,
          full_name: via.full_name,
          phone_number: via.phone_number,
          post_code: via.post_code,
          address: via.address,
          city: via.city,
        }));

        // Insert parcels into the database
        await this.pageModel.insertVias(viaRecords);
        // console.log(viaRecords)
        // return;



        // Send success response
        res.status(200).json({
          status: 1,
          msg: "Request Quote, Parcels and vias created successfully",
          data: {
            requestId: requestQuoteId
            
        }
        });
      } else {
        return res.status(200).json({
          error: "Token is required",
        });
      }
    } catch (error) {
      console.error("Error in createRequestQuote:", error);
      res.status(200).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  async getMemberFromToken(req, res) {
    try {
      const { token, memType } = req.body;
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // // Call the method from BaseController to get user data
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      return res.status(200).json({
        status: 1,
        member: userResponse?.user,
        // siteSettings:res.locals
      });
    } catch (error) {
      console.error("Error in getMemberFromToken:", error);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while processing the request.",
        error: error.message,
      });
    }
  }

  uploadProfileImage = async (req, res) => {
    try {
      const { token, memType } = req.body; // Extract token and memType from request body

      // Validate token
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // Validate token and get user data
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }

      const member = userResponse.user;

      // Check if file was uploaded
      if (!req.file) {
        return res.status(200).json({ status: 0, msg: "No file uploaded." });
      }

      // Get the uploaded file and construct the file path
      const memImage = req.file.filename;
      const imageUrl = `${memImage}`; // Customize the path based on your application structure if needed

      // Update the profile image in the database based on memType
      if (memType === "user") {
        await this.member.updateMemberData(member.id, {
          mem_image: imageUrl,
        });
      } else if (memType === "rider") {
        await this.rider.updateRiderData(member.id, {
          mem_image: imageUrl,
        });
      } else {
        return res.status(200).json({ status: 0, msg: "Invalid memType provided." });
      }

      // Send success response
      return res.status(200).json({
        status: 1,
        msg: "Image uploaded successfully.",
        mem_image: imageUrl,
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
      const { token, first_name, last_name, mem_phone, address, bio, memType } =
        req.body; // Assuming token and user data are sent in the request body

      // If no token is provided
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const member = userResponse.user;
      const userId = member?.id;
      // Validate the fields
      if (!first_name || !last_name || !mem_phone || !address) {
        return res.status(200).json({
          status: 0,
          msg: "First name, last name, phone number, and address are required.",
        });
      }

      // Save the updated member data
      const updatedData = {
        full_name: first_name + " " + last_name,
        mem_phone,
        mem_address1: address,
        mem_bio: bio || "", // If bio is provided, use it; otherwise, set it to an empty string
      };

      // Check memType and update accordingly
      if (memType === "user") {
        await this.member.updateMemberData(userId, updatedData); // Update member data
      } else if (memType === "rider") {
        await this.rider.updateRiderData(userId, updatedData); // Update rider data
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid memType provided." });
      }
      // Send a success response
      return res.status(200).json({
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
      const {
        token,
        current_password,
        new_password,
        confirm_password,
        memType,
      } = req.body;

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

      // Validate token and fetch user data
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }

      const user = userResponse.user;
      const userId = user?.id;

      // Check if the current password matches the one in the database
      const isCurrentPasswordValid = await bcrypt.compare(
        current_password,
        user.password
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
      const updatedData = {
        password: hashedPassword,
      };

      if (memType === "user") {
        // Update password for member
        await this.member.updateMemberData(userId, updatedData);
      } else if (memType === "rider") {
        // Update password for rider
        await this.rider.updateRiderData(userId, updatedData);
      } else {
        return res.status(200).json({
          status: 0,
          msg: "Invalid member type.",
        });
      }

      return res.status(200).json({
        status: 1,
        msg: "Password updated successfully.",
      });
    } catch (error) {
      console.error("Error changing password:", error.message);
      return res.status(200).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  };

 getUserOrders = async (req, res) => {
    try {
        const { token, memType } = req.body;
        console.log(req.body)

        if (!token) {
            return res.status(200).json({ status: 0, msg: "Token is required." });
        }

        if (memType !== "user") {
            return res.status(200).json({ status: 0, msg: "Invalid member type." });
        }

        // Validate the token and get the rider details
        const userResponse = await this.validateTokenAndGetMember(token, memType);
        

        if (userResponse.status === 0) {
            return res.status(200).json(userResponse); // Return validation error response
        }

        const member = userResponse.user;

        // Fetch requests for which the assigned rider is this user and status is 'accepted'
        const memberOrders = await this.member.getOrdersByUserAndStatus({
            userId: member.id,
            status: "accepted",
        });

        console.log("User Orders before encoding:", memberOrders);

        // Encode the `id` for each order
        const ordersWithEncodedIds = memberOrders.map((order) => {
            const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
            return { ...order, encodedId }; // Add encodedId to each order
        });

        console.log("Member Orders with Encoded IDs:", ordersWithEncodedIds);

        // Return the fetched orders with encoded IDs
        return res.status(200).json({
            status: 1,
            msg: "Orders fetched successfully.",
            orders: ordersWithEncodedIds,
        });
    } catch (error) {
        console.error("Error in getRiderOrders:", error);
        return res.status(200).json({
            status: 0,
            msg: "Internal server error.",
            error: error.message,
        });
    }
}

async getUserOrderDetailsByEncodedId(req, res) {
  try {
      const { token } = req.body;
      console.log(token)
      const { encodedId } = req.params;

      if (!token) {
          return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (!encodedId) {
          return res.status(200).json({ status: 0, msg: "Encoded ID is required." });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, "user");

      if (userResponse.status === 0) {
          return res.status(200).json(userResponse); // Return validation error response
      }

      const member = userResponse.user;

      // Decode the encoded ID
      const decodedId = helpers.doDecode(encodedId);
      console.log("Decoded ID:", decodedId); // Add this line to log the decoded ID

      // Fetch the order using the decoded ID and check if the rider_id matches the logged-in rider's ID
      let order = await this.member.getUserOrderDetailsById({ userId: member.id, requestId: decodedId });

      console.log("Order from DB:", order); // Add this line to log the order fetched from the database

      if (!order) {
          return res.status(200).json({ status: 0, msg: "Order not found." });
      }
      
      // Check if the assigned rider matches the logged-in rider
      if (order.user_id !== member.id) {
          return res.status(200).json({ status: 0, msg: "This order does not belong to the user." });
      }

      const parcels = await this.rider.getParcelsByQuoteId(order.id); // Assuming order.quote_id is the relevant field
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      order={...order,formatted_start_date:helpers.formatDateToUK(order?.start_date),encodedId:encodedId,parcels:parcels,vias:vias, invoices:invoices}
      // Fetch parcels and vias based on the quoteId from the order
      // Assuming order.quote_id is the relevant field

      // Return the order details along with parcels and vias
      return res.status(200).json({
          status: 1,
          msg: "Order details fetched successfully.",
          order,    // Add vias to the response
      });
  } catch (error) {
      console.error("Error in getOrderDetailsByEncodedId:", error);
      return res.status(200).json({
          status: 0,
          msg: "Internal server error.",
          error: error.message,
      });
  }
}

async userPaymentMethod(req, res) {
  try {
      const { token, memType } = req.body;

      console.log(req.body); // Log request body for debugging

      // Check if token is provided
      if (!token) {
          return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // Validate the member type
      if (memType !== "user") {
          return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }

      // Validate the token and fetch member details
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
          return res.status(200).json(userResponse); // Return validation error response
      }

      // Extract member details from response
      const member = userResponse.user;
      if (!member) {
          return res.status(404).json({ status: 0, msg: "Member not found." });
      }

      // Fetch site settings or other additional data
      const siteSettings = res.locals.adminData;

      // Combine member data and site settings
      const jsonResponse = {
          status: 1,
          msg: "Member data fetched successfully.",
              member,
              siteSettings,
          
      };

      // Return the combined JSON response
      return res.status(200).json(jsonResponse);
  } catch (err) {
      console.error("Error:", err.message);
      return res.status(500).json({ status: 0, msg: "Internal Server Error" });
  }
}

async addPaymentMethod(req, res) {
  try {
    const { payment_method_id, exp_month, exp_year, card_number, token, memType } = req.body;

    // Validate input fields
    if (!payment_method_id || !exp_month || !exp_year || !card_number || !token || !memType) {
      return res.status(200).json({ status: 0, msg: "All fields are required." });
    }

    // Validate member type (user or rider)
    if (memType !== "user" && memType !== "rider") {
      return res.status(200).json({ status: 0, msg: "Invalid member type." });
    }

    // Validate token and retrieve member details
    const memberResponse = await this.validateTokenAndGetMember(token, memType);
    if (memberResponse.status === 0) {
      return res.status(200).json(memberResponse);
    }

    const member = memberResponse.user;
    if (!member) {
      return res.status(200).json({ status: 0, msg: "Member not found." });
    }

    // Retrieve the payment method from Stripe using the payment method ID
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

    if (!paymentMethod) {
      return res.status(200).json({ status: 0, msg: "Payment method not found." });
    }

    // Validate expiration month/year and card number
    if (paymentMethod.card.exp_month !== parseInt(exp_month) || paymentMethod.card.exp_year !== parseInt(exp_year)) {
      return res.status(200).json({ status: 0, msg: "Invalid expiration date." });
    }

    if (paymentMethod.card.last4 !== card_number) {
      return res.status(200).json({ status: 0, msg: "Card number does not match." });
    }

    // Check if the user already has a payment method
    const existingMethods = await this.paymentMethodModel.getPaymentMethodsByUserId(member.id);
    const isDefault = existingMethods.length === 0 ? 1 : 0;

    // Insert the retrieved payment method into the database
    const newPaymentMethod = {
      user_id: member.id,
      user_type: memType,
      payment_method_id: paymentMethod.id,
      card_number: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      brand: paymentMethod.card.brand,
      is_default: isDefault,
    };

    const insertedPaymentMethod = await this.paymentMethodModel.addPaymentMethod(newPaymentMethod);
    const paymentMethods = await this.paymentMethodModel.getPaymentMethodsByUserId(member.id, memType);

    return res.status(200).json({
      status: 1,
      msg: "Payment method added successfully.",
      paymentMethod: insertedPaymentMethod,
      paymentMethods
    });
  } catch (err) {
    console.error("Error adding payment method:", err.message);
    return res.status(200).json({ status: 0, msg: "Internal Server Error" });
  }
}



}

module.exports = MemberController;
