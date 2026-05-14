// controllers/api/MemberController.js
const BaseController = require("../baseController");
const Member = require("../../models/memberModel");
const Rider = require("../../models/riderModel");
const adminRider = require("../../models/rider");

const VehicleModel = require("../../models/api/vehicleModel");
const Vehicle = require("../../models/vehicle");
const VehicleCategoryModel = require("../../models/vehicle-categories");
const PageModel = require("../../models/api/pages"); // Assuming you have this model
const PaymentMethodModel = require("../../models/api/paymentMethodModel"); // Assuming you have this model
const RequestQuoteModel = require("../../models/request-quote"); // Assuming you have this model
const RemotePostCodeModel = require("../../models/remote-post-code"); // Assuming you have this model
const PromoCodeModel = require("../../models/promo-code");

const { processRiderCharges } = require("../../services/riderChargeService");


const moment = require("moment");

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
const client = require("../../utils/goCardless");
const { SMTP_MAIL, SMTP_PASSWORD } = process.env;
const Stripe = require("stripe");
const { pool } = require("../../config/db-connection");
const { order } = require("paypal-rest-sdk");
const path = require("path");
const fs = require('fs');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
class MemberController extends BaseController {
  constructor() {
    super();
    this.member = new Member();
    this.rider = new Rider();
    this.adminRider = new adminRider();
    this.pageModel = new PageModel();
    this.requestQuoteModel = new RequestQuoteModel();
    this.tokenModel = new Token();
    this.addressModel = new Addresses();
    this.paymentMethodModel = new PaymentMethodModel();
    this.remotePostCodeModel = new RemotePostCodeModel();
    this.promoCodeModel = new PromoCodeModel();
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
  async createReviewForRequest(req, res) {
    try {
      const { token, memType, review, rider_review, rating, request_id } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
        return res.status(200).json({
          status: 0,
          msg: "Invalid member type. Only users can access this endpoint.",
        });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }

      const user = userResponse.user;
      const created_at = helpers.getUtcTimeInSeconds();
      let cleanedData = {
        review: typeof review === "string" ? review.trim() : "",
        rider_review: typeof rider_review === "string" ? rider_review.trim() : "",
        rating: rating.trim(),
        created_at: created_at,
        user_id: user?.id,
        request_id: request_id,
      };

      // console.log(validateRequiredFields(cleanedData))
      // Validation for empty fields
      if (!validateRequiredFields(cleanedData)) {
        return res
          .status(200)
          .json({ status: 0, msg: "All fields are required." });
      } else {
        const requestQuote = await this.rider.getRequestQuoteById(request_id);
        if (!requestQuote) {
          return res
            .status(200)
            .json({ status: 0, msg: "Request quote not found." });
        }
        const userRow = await this.rider.findById(requestQuote.assigned_rider);

        const existingReview = await this.rider.getRequestReviewByUserAndRequest(
          user.id,
          request_id
        );

        if (existingReview) {
          return res.status(200).json({
            status: 0,
            msg: "Review already submitted for this request.",
          });
        }

        const requestReview = await this.rider.createRequestReview(cleanedData);
        const orderDetailsLink = `/rider-dashboard/order-details/${helpers.doEncode(
          request_id
        )}`;
        let adminData = res.locals.adminData;
        const result = await helpers.sendEmail(
          userRow.email,
          `You've received a review for Booking ID: ${requestQuote?.booking_id}`,
          "request-review",
          {
            adminData,
            order: requestQuote,
            type: "user",
            review: cleanedData,
          }
        );
        const notificationText = `You've received a review from user.`;
        await helpers.storeNotification(
          requestQuote.assigned_rider, // The user ID from request_quote
          "rider", // The user's member type
          user.id, // Use rider's ID as the sender
          notificationText,
          orderDetailsLink
        );
        return res.status(200).json({
          status: 1,
          msg: "Review Posted Successfully!",
        });
      }

      return res.status(200).json({
        status: 1,
        states: states,
      });
    } catch (error) {
      console.error("Error in posting review:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message,
      });
    }
  }

  addAddressFromRequest = async (req, res) => {
    try {
      const { first_name,
        last_name,
        email,
        phone_number,
        address,
        post_code,
        city } = req.body;

      // 🔥 REQUIRED FIELD VALIDATION
      if (

        !first_name ||

        !phone_number
      ) {
        return res.status(200).json({
          status: 0,
          msg: "All fields (name, phone, address, token) are required",
        });
      }

      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const member = userResponse.user;

      const existingAddresses =
        await this.addressModel.getAddressByIdAndAddress(
          member.id,
          address
        );

      if (existingAddresses.length > 0) {
        return res.status(200).json({
          status: 0,
          msg: "Address already exists",
        });
      }

      // Check if user already has addresses
      const existingAddressesfordefault = await this.addressModel.getAddressesByUserId(
        member.id
      );

      const isDefault = existingAddressesfordefault.length === 0 ? 1 : 0;


      // ✅ FIXED INSERT
      await this.addressModel.insertAddress({
        mem_id: member.id,
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number,
        address: address,
        post_code: post_code,
        city: city,
        default: isDefault, // ✅ REQUIRED
      });

      // ✅ FIXED VARIABLE
      const addresses =
        await this.addressModel.getAddressesByUserId(member.id);

      return res.status(200).json({
        status: 1,
        msg: "Address added successfully",
        addresses,
      });

    } catch (err) {
      console.error("Add address error:", err);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error",
      });
    }
  };
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
      if (!memType) {
        return res.status(200).json({
          status: 0,
          msg: "memType is required.",
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
    const vehicleCategoryModel = new VehicleCategoryModel();
    const { token, memType, address_id, id } = req.body;

    let quoteDetails = null;
    let member = null;
    let paymentMethods = [];
    let addressesData = [];

    try {
      const siteSettings = res.locals.adminData;

      // Fetch featured vehicles and categories
      const vehiclesData = await vehicleModel.findFeatured();
      const vehicleCategoriesData = await VehicleCategoryModel.getActiveVehicleCategories();
      const remotePostCodes = await RemotePostCodeModel.getRemotePostCodesInArray();

      // Token check
      if (token && token !== "null") {
        if (memType === "rider") {
          return res.status(200).json({ status: 0, msg: "Rider account cannot create request!" });
        }

        const userResponse = await this.validateTokenAndGetMember(token, memType);
        if (userResponse.status === 0) {
          return res.status(200).json(userResponse);
        }

        member = userResponse.user;
        if (!member) {
          return res.status(200).json({ status: 0, msg: "Member not found." });
        }

        // Fetch user addresses
        addressesData = await this.addressModel.getAddressesByUserId(member.id);
        // console.log("Fetched addresses:", addressesData);

        // Decode ID (quote ID) and fetch quote details
        let decodedId = id ? helpers.doDecode(id) : null;
        if (decodedId) {
          quoteDetails = await RequestQuoteModel.getRequestQuoteDetailsById(decodedId);
          if (!quoteDetails) {
            return res.status(200).json({ status: 0, msg: "Quote not found." });
          }
        }

        // Fetch and format payment methods
        const fetchedPaymentMethods = await this.paymentMethodModel.getPaymentMethodsByUserId(member.id, memType);
        if (fetchedPaymentMethods?.length > 0) {
          paymentMethods = fetchedPaymentMethods.map((method) => ({
            encoded_id: helpers.doEncode(method.id),
            card_number: helpers.doDecode(method.card_number),
          }));
        }
      }

      // Final JSON response
      res.json({
        addressesData,
        siteSettings,
        vehicles: vehiclesData,
        vehicleCategories: vehicleCategoriesData,
        member,
        paymentMethods,
        remotePostCodes,
        quoteDetails,
      });

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
      _source_fulladdress,
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
      order_details,
      promo_code,
      totalDistance,
      remote_price,
      price,
      handball_work
    } = req.body;

    // console.log("Received paymentIntent request with body:", req.body.remote_price);

    // console.log("paymentIntent called with body:", req.body);

    const requiredFields = [
      "selectedVehicle",
      // "price",
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
    // console.log("Validation errors:", errors);
    if (!isValid) {
      return res.status(200).json({
        status: 0,
        msg: "Validation failed",
        errors,
      });
    }
    // console.log(memType)
    try {
      const siteSettings = res.locals.adminData;
      let order_amount_details = await helpers.calculateOrderTotal(
        totalDistance,
        siteSettings,
        price,
        remote_price,
        selectedVehicle,
        handball_work
      );
      // console.log("Calculated order amount details:", order_amount_details);
      const total_distance = order_amount_details?.totalDistance;
      let total_amount = order_amount_details?.totalAmount;
      let taxAmount = order_amount_details?.taxAmount;
      let vatAmount = order_amount_details?.vatAmount;

      let grandTotal = order_amount_details?.grandTotal;
      // console.log("Grand total before promo code:", grandTotal);

      let userId;
      let token_arr = {};
      let isSignup = false; // <-- flag to track signup
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
        const userExist = await this.member.findByEmail(email);
        if (userExist) {
          return res
            .status(200)
            .json({ status: 0, msg: "User already exists! Please login to continue!" });
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

        isSignup = true; // <-- mark as signup

        // console.log("User created with ID:", userId);
      }

      // Generate token for user if not provided
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment

      // Generate a random number and create the token
      const randomNum = crypto.randomBytes(16).toString("hex");
      const tokenType = "user";
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Token expires in 1 hour

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
      // Send email **only on signup**
      if (isSignup) {
        let adminData = res.locals.adminData;
        const otp = Math.floor(100000 + Math.random() * 900000);

        const subject = "Verify Your Email - " + adminData.site_name;
        const templateData = {
          username: full_name, // Pass username
          otp: otp, // Pass OTP
          adminData,
        };

        const result = await helpers.sendEmail(
          email,
          subject,
          "email-verify",
          templateData
        );
      }

      // console.log("result:", result);
      if (
        grandTotal == undefined ||
        grandTotal == null ||
        parseFloat(grandTotal) <= 5
      ) {
        return res.status(200).json({
          status: 0,
          message: "Price should be greater than 5",
        });
      }

      let discount = 0;

      let formattedTotalPrice = parseFloat(grandTotal);

      let subTotal = 0;
      // console.log(promo_code);
      if (
        promo_code !== "" &&
        promo_code !== null &&
        promo_code !== "null" &&
        promo_code !== undefined
      ) {
        const promo = await this.promoCodeModel.findByCode(promo_code);
        console.log("Promo code lookup result:", promo);

        if (!promo) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid promo code." });
        }

        const currentDate = new Date();
        console.log("Checking promo code expiry:", promo.expiry_date, currentDate);
        if (promo.expiry_date && new Date(promo.expiry_date) < currentDate) {
          return res.status(200).json({ error: "Promo code has expired." });
        }

        if (promo.promo_code_type === "percentage") {
          discount = (total_amount * promo.percentage_value) / 100;
        } else if (promo.promo_code_type === "amount") {
          discount = promo.percentage_value;
        } else {
          return res.status(200).json({ error: "Promo code has expired." });
        }

        formattedTotalPrice = total_amount - discount;

        formattedTotalPrice = parseFloat(formattedTotalPrice.toFixed(2));
      }

      // console.log("formattedTotalPrice api:", formattedTotalPrice);
      // console.log("taxAmount api:", taxAmount);

      // console.log("grandTotal before promo api:", grandTotal);

      // Handle payment logic
      const parsedAmount = parseFloat(formattedTotalPrice);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res
          .status(200)
          .json({ error: "Amount must be a positive number." });
      }

      // console.log("Amount after discounts & tax (decimal):", parsedAmount);


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



      // Stripe minimum amount check (example for USD/GBP = 50 cents/pence)
      if (amountInCents < 50) {
        return res.status(200).json({
          status: 0,
          message: "Total amount is too low for Stripe. Must be at least $0.50 / £0.50.",
          finalAmount: parsedAmount
        });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        payment_method: payment_method_id,
        customer: stripeCustomer.id,
        setup_future_usage: "off_session",
      });
      // console.log(paymentIntent,finalAmount,paymentIntent)

      // Respond with payment details
      return res.status(200).json({
        status: 1,
        user_id: userId,
        customer_id: stripeCustomer.id,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        authToken: token_arr?.authToken,
        mem_type: token_arr?.type,
        finalAmount: formattedTotalPrice,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return res.status(200).json({
        status: 0,
        message: "Failed to create payment intent",
        error: error.message,
      });
    }
  }

  async paymentIntentForPendingOrders(req, res) {
    const {

      payment_method_id,
      order_id
    } = req.body;

    // console.log("paymentIntent called with body:", req.body);



    const requestQuote = await RequestQuoteModel.getRequestQuoteById(order_id);
    if (!requestQuote) {
      return res
        .status(200)
        .json({ status: 0, msg: "Request quote not found." });
    }
    const userRow = await this.member.findById(requestQuote?.user_id);


    try {

      const total_amount = requestQuote[0]?.total_amount;
      console.log(requestQuote, total_amount)

      // console.log("result:", result);
      if (
        total_amount == undefined ||
        total_amount == null ||
        parseFloat(total_amount) <= 5
      ) {
        return res.status(200).json({
          status: 0,
          message: "Price should be greater than 5",
        });
      }


      // Handle payment logic
      const parsedAmount = parseFloat(total_amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res
          .status(200)
          .json({ error: "Amount must be a positive number." });
      }

      // console.log("Amount after discounts & tax (decimal):", parsedAmount);


      // Create customer on Stripe
      const stripeCustomer = await stripe.customers.create({
        username: userRow?.full_name,
        email: userRow?.email,
      });

      // Retrieve payment method
      const paymentMethod = await stripe.paymentMethods.retrieve(
        payment_method_id
      );



      // Create payment intent
      const amountInCents = Math.round(parsedAmount * 100);



      // Stripe minimum amount check (example for USD/GBP = 50 cents/pence)
      if (amountInCents < 50) {
        return res.status(200).json({
          status: 0,
          message: "Total amount is too low for Stripe. Must be at least $0.50 / £0.50.",
          finalAmount: parsedAmount
        });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        payment_method: payment_method_id,
        customer: stripeCustomer.id,
        setup_future_usage: "off_session",
      });
      // console.log(paymentIntent,finalAmount,paymentIntent)

      // Respond with payment details
      return res.status(200).json({
        status: 1,
        user_id: userRow?.id,
        customer_id: stripeCustomer.id,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        finalAmount: parsedAmount,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return res.status(200).json({
        status: 0,
        message: "Failed to create payment intent",
        error: error.message,
      });
    }
  }
  async updateApplePaymentStatus(req, res) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"];
    let event;
    // console.log("req body", req.body);
    try {
      // Convert the raw Buffer to a string
      const rawBody = req.body.toString();

      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

      await helpers.storeWebHookData({
        type: "event created",
        response: JSON.stringify(event),
      });
    } catch (err) {
      await helpers.storeWebHookData({
        type: "⚠️ Webhook signature verification failed:",
        response: JSON.stringify(err),
      });
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process only successful payments
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.order_id;
      const paymentIntentId = paymentIntent.id;

      // console.log(`✅ Apple Pay Payment Successful for Order: ${orderId}`);
      // console.log(`💳 Payment Intent ID: ${paymentIntentId}`);

      if (orderId) {
        try {
          let order = await this.member.getUserOrderDetailsById({
            requestId: orderId,
          });
          if (!order) {
            return res.status(200).json({ status: 0, msg: "Order not found." });
          }
          await this.member.updateRequestData(order.id, {
            status: "paid",
            payment_intent: paymentIntentId,
          });
          await helpers.storeWebHookData({
            type: `💳 Payment Intent ID: ${paymentIntentId}`,
            response: `✅ Apple Pay Payment Successful for Order: ${orderId}`,
          });

          // console.log(`📦 Order ${orderId} updated to PAID`);
        } catch (error) {
          console.error(`❌ Error updating order ${orderId}:`, error);
          return res
            .status(500)
            .json({ error: "Failed to update order status" });
        }
      } else {
        console.error("❌ Order ID missing in metadata.");
        return res
          .status(400)
          .json({ error: "Order ID is required in metadata" });
      }
    }

    res.json({ received: true });
  }

  async webhookPaypalRequest(req, res) {
    try {
      const webhookEvent = req.body;
      // console.log("Received PayPal Webhook:", webhookEvent);

      const eventType = webhookEvent.event_type;
      const orderID = webhookEvent.resource.id; // PayPal Order ID
      const resource = webhookEvent.resource; // Your custom order_id
      const custom_id = webhookEvent.resource.purchase_units?.[0]?.custom_id; // Your custom order_id
      const reference_id =
        webhookEvent.resource.purchase_units?.[0]?.reference_id; // Your custom order_id
      const payerID = webhookEvent.resource.payer?.payer_id; // ✅ Extract payer_id
      const siteSettings = res.locals.adminData;
      if (eventType === "CHECKOUT.ORDER.APPROVED") {
        if (reference_id === "order") {
          const orderDetails = await RequestQuoteModel.getOrderDetailsById(
            custom_id
          );
          if (!orderDetails) {
            return this.sendError(res, "Order not found");
          }
          await this.member.updateRequestQuoteData(orderDetails.id, {
            status: "paid",
            payment_intent: payerID,
          });
          const source_city = orderDetails?.source_city;
          const orderDetailsLink = `/rider-dashboard/jobs`;

          const ridersInCity = await this.rider.getRidersByCity(source_city);

          if (ridersInCity && ridersInCity.length > 0) {
            const notificationText = `A new request has been created in your city: ${source_city}`;

            // Loop through each rider and send a notification
            for (const rider of ridersInCity) {
              const riderId = rider.id;
              // console.log(riderId,member?.id);return;

              await helpers.storeNotification(
                riderId,
                "rider", // mem_type
                orderDetails?.user_id, // sender (the requester)
                notificationText,
                orderDetailsLink
              );

              const parcelsArray = await this.rider.getParcelDetailsByQuoteId(
                orderDetails.id
              );
              const order_stages_arr = await this.rider.getRequestOrderStages(orderDetails.id);
              const orderRow = {
                ...orderDetails,
                parcels: parcelsArray,

                order_stages: order_stages_arr,
                start_date: helpers.formatDateToUK(orderDetails.start_date),
                // ✅ ensure proper numeric formatting
                total_amount: helpers.formatAmount(orderDetails.total_amount),
                tax: helpers.formatAmount(orderDetails.tax),

                distance: helpers.formatAmount(orderDetails.distance),
              };
              await helpers.sendEmail(
                rider.email,
                "New Order Requests - FastUk",
                "request-quote",
                {
                  adminData: siteSettings,
                  order: orderRow,
                  type: "rider",
                }
              );
            }
          }

          const created_time = helpers.getUtcTimeInSeconds();
          const formattedTotalAmount = helpers.formatAmount(
            orderDetails?.total_amount || 0
          );
          // Insert Transaction Record
          await helpers.storeTransactionLogs({
            user_id: orderDetails?.user_id,
            amount: formattedTotalAmount,
            payment_method: "paypal",
            transaction_id: orderDetails?.id,
            created_time: created_time,
            status: "paid",
            payment_intent_id: payerID,
            payment_method_id: "",
            type: "Request Quote",
          });

          const userRow = await this.member.findById(orderDetails.user_id);

          const parcelsArray = await this.rider.getParcelDetailsByQuoteId(
            orderDetails?.id
          );
          const order_stages_arr = await this.rider.getRequestOrderStages(orderDetails.id);
          const orderRow = {
            ...orderDetails,
            parcels: parcelsArray,
            order_stages: order_stages_arr,
            start_date: helpers.formatDateToUK(orderDetails.start_date),
          };

          const templateData = {
            username: userRow.full_name, // Pass username
            adminData: siteSettings,
            order: orderRow,
            type: "user",
          };
          // console.log("templateData:", templateData)

          const result = await helpers.sendEmail(
            userRow.email,
            "Parcel Request Confirmed: Awaiting Rider Assignment - FastUk",
            "request-quote",
            templateData
          );
          await helpers.storeWebHookData({
            type: `Paypal Payer ID: ${payerID}`,
            response: `Paypal Payment Successful for Order: ${custom_id}`,
          });
        } else if (reference_id === "credit_invoice") {
          let credit_invoice_row = await this.member.getCreditInvoicesById(
            custom_id
          );
          if (credit_invoice_row === null) {
            return res
              .status(200)
              .json({ status: 0, msg: "Invoice not found." });
          }
          let userId = credit_invoice_row?.user_id;
          let user = await this.member.findById(userId);
          if (user === null) {
            return res.status(200).json({ status: 0, msg: "User not found." });
          }
          // console.log("user",user)
          const formattedAmount = helpers.formatAmount(
            parseFloat(credit_invoice_row?.amount)
          );
          // console.log("formattedAmount",formattedAmount)
          await this.member.updateMemberData(userId, {
            total_credits:
              parseFloat(user?.total_credits) + parseFloat(formattedAmount),
          });

          const invoice = await this.paymentMethodModel.getInvoiceById(
            custom_id
          );
          if (!invoice) {
            return res
              .status(200)
              .json({ status: 0, msg: "Invoice not found." });
          }

          // console.log("ids:",payment_intent,payment_methodid);return;

          const updateResult =
            await this.paymentMethodModel.updateInvoicePaymentDetails(
              custom_id,
              {
                payment_intent_id: payerID,
                payment_method_id: "",
                payment_intent: payerID,
                payment_method: "paypal",
              }
            );
          if (updateResult.affectedRows > 0) {
            await helpers.storeTransactionLogs({
              user_id: userId,
              amount: formattedAmount,
              payment_method: "paypal",
              transaction_id: 0,
              created_time: helpers.getUtcTimeInSeconds(),
              status: "paid",
              payment_intent_id: payerID,
              payment_method_id: "",
              type: "credits",
            });
            const createdDate = helpers.getUtcTimeInSeconds();
            const creditEntry = {
              user_id: userId,
              type: "admin", // Change type to 'user' as per requirement
              credits: formattedAmount, // Credits used by the user
              created_date: createdDate,
              e_type: "credit", // Debit type entry
            };

            await this.pageModel.insertInCredits(creditEntry);

            const dueAmount = await RequestQuoteModel.calculateDueAmount(
              userRow.id
            );
            const orderDetailsLink = `/rider-dashboard/order-details/${helpers.doEncode(
              requestId
            )}`;

            // console.log("orderRow:", orderRow, "userRow:", userRow, dueAmount);

            if (parseFloat(dueAmount) <= 0) {
              const notificationText = `Invoice is paid by the user.Now mark the request as completed`;
              await helpers.storeNotification(
                userRow.assigned_rider, // The user ID from request_quote
                "rider", // The user's member type
                userRow?.user_id, // Use rider's ID as the sender
                notificationText,
                orderDetailsLink
              );
              // console.log("Assigned Rider:", userRow?.assigned_rider, "User ID:", userId);
              const result = await helpers.sendEmail(
                userRow.email,
                "Invoice paid for: " + userRow?.booking_id,
                "request-invoice-paid",
                {
                  adminData,
                  order: orderRow,
                  type: "user",
                }
              );
            }

            return res
              .status(200)
              .json({ status: 1, msg: "Credits added successfully." });
          } else {
            return res
              .status(200)
              .json({ status: 0, msg: "Failed to update invoice." });
          }
        } else if (reference_id === "invoice") {
          const invoiceDetails = await this.rider.getInvoicesById(custom_id);
          if (!invoiceDetails) {
            return this.sendError(res, "Invoice not found");
          }
          // console.log('invoiceDetails',invoiceDetails)
          const orderDetails = await RequestQuoteModel.getOrderDetailsById(
            invoiceDetails?.request_id
          );
          if (!orderDetails) {
            return this.sendError(res, "Order not found");
          }
          await this.rider.updateRequestInvoice(invoiceDetails.id, {
            status: 1,
            payment_intent_id: payerID,
          });

          const formattedTotalAmount = helpers.formatAmount(
            invoiceDetails?.amount || 0
          );
          const created_time = helpers.getUtcTimeInSeconds();
          await helpers.storeTransactionLogs({
            user_id: orderDetails?.user_id,
            amount: formattedTotalAmount,
            payment_method: "paypal",
            transaction_id: orderDetails?.id,
            created_time: created_time,
            status: "paid",
            payment_intent_id: payerID,
            payment_method_id: "",
            type: "Invoice",
          });

          let adminData = res.locals.adminData;
          // const request = await this.rider.getRequestById(54, 9);
          const userRow = await this.rider.findById(
            orderDetails.assigned_rider
          );
          const parcels = await this.rider.getParcelDetailsByQuoteId(
            orderDetails.id
          );
          const order_stages_arr = await this.rider.getRequestOrderStages(orderDetails.id);
          const dueAmount = await RequestQuoteModel.calculateDueAmount(
            orderDetails.id
          );
          let request_row = orderDetails;
          const requestRow = {
            ...request_row, // Spread request properties into order
            parcels: parcels,
            order_stages: order_stages_arr
          };
          if (parseFloat(dueAmount) <= 0) {
            const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

            const notificationText = `Invoice is paid by the user.Now mark the request as completed`;
            await helpers.storeNotification(
              userRow.id, // The user ID from request_quote
              "rider", // The user's member type
              request_row?.user_id, // Use rider's ID as the sender
              notificationText,
              orderDetailsLink
            );
            // console.log(
            //   request_row?.user_id,
            //   userRow.id,
            //   "request_row:",
            //   request_row,
            //   "userRow:",
            //   userRow
            // );
            const result = await helpers.sendEmail(
              userRow.email,
              "Invoice paid for: " + orderDetails?.booking_id,
              "request-invoice-paid",
              {
                adminData,
                order: requestRow,
                type: "user",
              }
            );
          }
          await helpers.storeWebHookData({
            type: `Paypal Payer ID for Invoice: ${payerID}`,
            response: `Paypal Payment Successful for Invoice: ${custom_id}`,
          });
        }

        return res
          .status(200)
          .json({ message: "Webhook received successfully" });
      }

      return res.status(200).json({ error: "Unhandled event type" });
    } catch (error) {
      console.error("Webhook Error:", error);
      return res.status(200).json({ error: "Internal Server Error" });
    }
  }


  async webhookGoCardlessRequest(req, res) {
    try {
      // console.log("✅ Webhook hit!"); 
      // // console.log("Headers:", req.headers); 
      // // console.log("Body:", JSON.stringify(req.body, null, 2)); 
      const now = new Date(); const timestamp = now.toISOString().replace(/[:.]/g, "-");
      const logsDir = path.join(__dirname, "logs");
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
      // console.log("Writing logs to:", logsDir) 
      // // ✅ Step 1: Verify signature 
      const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;
      const signature = req.headers["webhook-signature"];
      const body = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
      const hmac = crypto.createHmac("sha256", webhookSecret).update(body, "utf8").digest("hex");
      if (hmac !== signature) {
        console.error("⚠️ Invalid webhook signature");
        const invalidFile = path.join(logsDir, `gc_invalid_signature_${timestamp}.json`);
        fs.writeFileSync(invalidFile, body, "utf-8");
        return res.status(200).send("Invalid signature");
      }
      const payload = req.body;
      // ✅ Step 2: Save raw webhook to file 
      const successFile = path.join(logsDir, `gc_webhook_${timestamp}.json`);

      fs.writeFileSync(successFile, JSON.stringify(payload, null, 2), "utf-8");
      // ✅ Step 3: Loop through events 
      const events = payload.events || [];
      for (const event of events) {
        // console.log("event", event) 
        const { id, action, resource_type, links, resource_metadata = {} } = event;
        let invoiceId = resource_metadata.invoice_id || null;
        // console.log("invoiceIdddddd", invoiceId) 
        let paymentId = links?.payment || null;
        // console.log("Processing event:", id, resource_type, action); 
        // 🔔 Debug log // console.log("🔔 GoCardless Event:", { action, resource_type, paymentId, invoiceId }); 
        // ✅ Handle payments 
        // // console.log("resource_type", resource_type) 
        if (resource_type === "payments") {
          //  fetch full payment object to get metadata 
          const payment = await client.payments.find(paymentId);
          invoiceId = payment?.metadata?.invoiceId || invoiceId;
          const orderId = payment?.metadata?.order_id || null;
          const type = payment?.metadata?.type || "credit_invoice";

          // const invoiceId = payment?.metadata?.invoice_id || null;
          const userId = payment?.metadata?.user_id || null;
          // console.log("🔎 Payment metadata:", payment.metadata); 
          // console.log("action:", action); 
          switch (action) {
            case "created": {
              // console.log(`🟡 Payment ${paymentId} created for invoice ${invoiceId}`);
              const order_id = payment?.metadata?.order_id;
              const type = payment?.metadata?.type || "credit_invoice";

              if (type === "credit_invoice") {
                const credit_invoice_row = await this.member.getCreditInvoicesById(Number(invoiceId));
                if (!credit_invoice_row) {
                  console.error(`❌ Credit invoice not found for invoice_id ${invoiceId}`);
                  break;
                }

                const dbUserId = credit_invoice_row.user_id;
                const formattedAmount = helpers.formatAmount(parseFloat(credit_invoice_row.amount));

                await helpers.storeTransactionLogs({
                  user_id: dbUserId,
                  amount: formattedAmount,
                  payment_method: "gocardless",
                  transaction_id: order_id && !isNaN(order_id) ? parseInt(order_id, 10) : null,
                  created_time: helpers.getUtcTimeInSeconds(),
                  status: "paid",
                  payment_intent_id: "",
                  payment_method_id: payment.links?.mandate || "",
                  type: "Request Quote",
                  status: "pending",
                });

                if (process.env.GC_ENVIRONMENT !== "live") {
                  try {
                    // await this.confirmPayment(paymentId);
                    await this.handleConfirmedPayment(payment, invoiceId, dbUserId, formattedAmount);
                  } catch (e) {
                    console.error("❌ Failed to auto-confirm sandbox payment:", e.message);
                  }
                }
              } else if (type === "order") {
                // For "order" type, don’t call getCreditInvoicesById
                const orderId = order_id;
                const orderDetails = await RequestQuoteModel.getOrderDetailsById(orderId);

                if (!orderDetails) {
                  console.error(`❌ Order not found for order_id ${orderId}`);
                  break;
                }

                const dbUserId = orderDetails.user_id;
                const formattedAmount = helpers.formatAmount(parseFloat(orderDetails.total_amount));

                await helpers.storeTransactionLogs({
                  user_id: dbUserId,
                  amount: formattedAmount,
                  payment_method: "gocardless",
                  transaction_id: orderId,
                  created_time: helpers.getUtcTimeInSeconds(),
                  status: "paid",
                  payment_intent_id: "",
                  payment_method_id: payment.links?.mandate || "",
                  type: "Request Quote",
                  status: "pending",
                });

                if (process.env.GC_ENVIRONMENT !== "live") {
                  try {
                    // await this.confirmPayment(paymentId);
                    await this.handleOrderPayment(payment, orderId, dbUserId);
                  } catch (e) {
                    console.error("❌ Failed to auto-confirm sandbox payment:", e.message);
                  }
                }
              }
              break;
            }

            case "confirmed":
              if (type === "credit_invoice") {
                await this.handleConfirmedPayment(payment, invoiceId, dbUserId, formattedAmount);
              } else if (type === "order") {
                await this.handleOrderPayment(payment, orderId, dbUserId);
              }
              break;
            // case "confirmed":
            //   await this.handleConfirmedPayment(payment, invoiceId, dbUserId, formattedAmount);
            //   break;
            case "failed":
              console.log(`❌ Payment ${paymentId} failed for invoice ${invoiceId}`);
              break;
            case "cancelled":
              console.log(`⚠️ Payment ${paymentId} cancelled for invoice ${invoiceId}`);
              break;
            default:
              console.log(`ℹ️ Ignoring payment action: ${action}`);
          }
        }
        // ✅ Handle billing request (fulfillment gives invoiceId early) 
        if (resource_type === "billing_requests" && action === "fulfilled") {
          // console.log(📌 Billing request fulfilled for invoice ${invoiceId}); 
        }
      }
      return res.status(200).json({ status: 1, msg: "Webhook processed" });
    } catch (error) {
      console.error("❌ GoCardless webhook error:", error);
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const logsDir = path.join(__dirname, "logs");
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
        const errorFile = path.join(logsDir, `gc_webhook_error_${timestamp}.json`);
        fs.writeFileSync(errorFile, JSON.stringify({ error: error.message, stack: error.stack, body: req.body, }, null, 2), "utf-8");
        // console.log(`⚠️ Error logged to: ${errorFile}`);
      } catch (logErr) {
        console.error("⚠️ Failed to write error log:", logErr);

      } return res.status(200).send("Server error");
    }
  }
  async handleConfirmedPayment(payment, invoiceId, dbUserId, formattedAmount) {
    // console.log(`✅ Handling confirmed payment ${payment.id} for invoice ${invoiceId}`);
    const order_id = payment?.metadata?.order_id || null; // ✅ FIX ADDED

    if (!invoiceId) {
      console.error("❌ No invoice ID found in metadata");
      return;
    }
    const user = await this.member.findById(dbUserId);
    if (!user) {
      console.error(`❌ User ${dbUserId} not found`); return;
    } // update credits 
    await this.member.updateMemberData(dbUserId,
      { total_credits: parseFloat(user.total_credits) + parseFloat(formattedAmount), });
    const invoice = await this.paymentMethodModel.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(200).json({ status: 0, msg: "Invoice not found." });
    }
    // update invoice 
    const updateResult = await this.paymentMethodModel.updateInvoicePaymentDetails(invoiceId,
      {
        payment_intent_id: payment.id,
        payment_method_id: payment.links?.mandate || "",
        payment_intent: "",
        payment_method: "gocardless",
      });
    // console.log("updateResult:", updateResult);
    if (updateResult.affectedRows > 0) {
      await helpers.storeTransactionLogs({
        user_id: dbUserId,
        amount: formattedAmount,
        payment_method: "gocardless",
        transaction_id: order_id && !isNaN(order_id) ? parseInt(order_id, 10) : null,
        created_time: helpers.getUtcTimeInSeconds(),
        status: "paid",
        payment_intent_id: "",
        payment_method_id: payment.links?.mandate || "",
        type: "credits",
        status: "confirmed"
      });
      // console.log("Transaction recorded");
      await this.pageModel.insertInCredits({
        user_id: dbUserId,
        type: "user",
        credits: formattedAmount,
        created_date: helpers.getUtcTimeInSeconds(),
        e_type: "credit",
      });
      // console.log("Credit entry added");
      // console.log(`🎉 Invoice ${invoiceId} marked as paid & credits added.`);
    } else {
      console.error(`❌ Failed to update invoice ${invoiceId}`);
    }
  }

  async handleOrderPayment(payment, orderId, userId, res) {
    try {
      // console.log(`✅ Handling GoCardless order payment for order ${orderId}`);

      const orderDetails = await RequestQuoteModel.getOrderDetailsById(orderId);
      if (!orderDetails) {
        console.error("❌ Order not found:", orderId);
        return;
      }

      // Update order as paid
      await this.member.updateRequestQuoteData(orderDetails.id, {
        status: "paid",
        payment_intent: payment.id,
      });


      const source_city = orderDetails?.source_city;
      const orderDetailsLink = `/rider-dashboard/jobs`;
      // const siteSettings = res.locals.adminData;
      const siteSettings = global.adminData || {}; // ✅ Fallback instead of res.locals


      // Notify all riders in that city
      const ridersInCity = await this.rider.getRidersByCity(source_city);
      if (ridersInCity?.length) {
        const notificationText = `A new request has been created in your city: ${source_city}`;
        for (const rider of ridersInCity) {
          await helpers.storeNotification(
            rider.id,
            "rider",
            orderDetails?.user_id,
            notificationText,
            orderDetailsLink
          );

          const parcelsArray = await this.rider.getParcelDetailsByQuoteId(orderDetails.id);
          const order_stages_arr = await this.rider.getRequestOrderStages(orderDetails.id);

          const orderRow = {
            ...orderDetails,
            parcels: parcelsArray,
            order_stages: order_stages_arr,
            start_date: helpers.formatDateToUK(orderDetails.start_date),
            total_amount: helpers.formatAmount(orderDetails.total_amount),
            tax: helpers.formatAmount(orderDetails.tax),

            distance: helpers.formatAmount(orderDetails.distance),
          };

          await helpers.sendEmail(
            rider.email,
            "New Order Requests - FastUk",
            "request-quote",
            { adminData: siteSettings, order: orderRow, type: "rider" }
          );
        }
      }

      // Insert transaction
      const created_time = helpers.getUtcTimeInSeconds();
      const formattedTotalAmount = helpers.formatAmount(orderDetails?.total_amount || 0);

      await helpers.storeTransactionLogs({
        user_id: orderDetails?.user_id,
        amount: formattedTotalAmount,
        payment_method: "gocardless",
        transaction_id: orderDetails?.id,
        created_time,
        status: "paid",
        payment_intent_id: payment.id,
        payment_method_id: payment.links?.mandate || "",
        type: "Request Quote",
        status: "confirmed"
      });

      // Email user
      const userRow = await this.member.findById(orderDetails.user_id);
      const parcelsArray = await this.rider.getParcelDetailsByQuoteId(orderDetails.id);
      const order_stages_arr = await this.rider.getRequestOrderStages(orderDetails.id);

      const orderRow = {
        ...orderDetails,
        parcels: parcelsArray,
        order_stages: order_stages_arr,
        start_date: helpers.formatDateToUK(orderDetails.start_date),
      };

      const templateData = {
        username: userRow.full_name,
        adminData: siteSettings,
        order: orderRow,
        type: "user",
      };

      await helpers.sendEmail(
        userRow.email,
        "Parcel Request Confirmed: Awaiting Rider Assignment - FastUk",
        "request-quote",
        templateData
      );

      await helpers.storeWebHookData({
        type: `GoCardless Payment ID: ${payment.id}`,
        response: `GoCardless Payment Successful for Order: ${orderId}`,
      });

      // console.log(`🎉 Order ${orderId} marked paid & notifications sent.`);

    } catch (err) {
      console.error("❌ Error in handleOrderPayment:", err);
    }
  }


  //   async webhookGoCardlessRequest(req, res) {
  //   try {
  //     const now = new Date();
  //     const timestamp = now.toISOString().replace(/[:.]/g, "-");
  //     const logsDir = path.join(__dirname, "logs");
  //     if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

  //     const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;
  //     const signature = req.headers["webhook-signature"];
  //     const body = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
  //     const hmac = crypto.createHmac("sha256", webhookSecret).update(body, "utf8").digest("hex");

  //     if (hmac !== signature) {
  //       console.error("⚠️ Invalid webhook signature");
  //       const invalidFile = path.join(logsDir, `gc_invalid_signature_${timestamp}.json`);
  //       fs.writeFileSync(invalidFile, body, "utf-8");
  //       return res.status(200).send("Invalid signature");
  //     }

  //     const payload = req.body;
  //     const successFile = path.join(logsDir, `gc_webhook_${timestamp}.json`);
  //     fs.writeFileSync(successFile, JSON.stringify(payload, null, 2), "utf-8");

  //     const events = payload.events || [];

  //     for (const event of events) {
  //       const { id, action, resource_type, links, resource_metadata = {} } = event;
  //       const paymentId = links?.payment || null;

  //       if (resource_type === "payments") {
  //         const payment = await client.payments.find(paymentId);

  //         const invoiceId = payment?.metadata?.invoice_id || null;
  //         const orderId = payment?.metadata?.order_id || null;
  //         const userId = payment?.metadata?.user_id || null;
  //         const type = payment?.metadata?.type || "credit_invoice";

  //         // console.log("🔹 GoCardless Payment Event:", { action, type, invoiceId, orderId, userId });

  //         switch (action) {
  //           case "confirmed":
  //             if (type === "credit_invoice") {
  //               await this.handleConfirmedPayment(payment, invoiceId, userId);
  //             } else if (type === "order") {
  //               await this.handleOrderPayment(payment, orderId, userId);
  //             }
  //             break;

  //           case "failed":
  //             console.log(`❌ Payment ${paymentId} failed`);
  //             break;

  //           case "cancelled":
  //             console.log(`⚠️ Payment ${paymentId} cancelled`);
  //             break;

  //           default:
  //             console.log(`ℹ️ Ignoring action ${action}`);
  //         }
  //       }
  //     }

  //     return res.status(200).json({ status: 1, msg: "Webhook processed" });

  //   } catch (error) {
  //     console.error("❌ GoCardless webhook error:", error);
  //     const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  //     const logsDir = path.join(__dirname, "logs");
  //     if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  //     const errorFile = path.join(logsDir, `gc_webhook_error_${timestamp}.json`);
  //     fs.writeFileSync(
  //       errorFile,
  //       JSON.stringify({ error: error.message, stack: error.stack, body: req.body }, null, 2),
  //       "utf-8"
  //     );
  //     return res.status(200).send("Server error");
  //   }
  // }


  //   async handleConfirmedPayment(payment, invoiceId, dbUserId, formattedAmount) {
  //     console.log(`✅ Handling confirmed payment ${payment.id} for invoice ${invoiceId}`);

  //     if (!invoiceId) {
  //       console.error("❌ No invoice ID found in metadata");
  //       return;
  //     }

  //     const user = await this.member.findById(dbUserId);
  //     if (!user) {
  //       console.error(`❌ User ${dbUserId} not found`);
  //       return;
  //     }

  //     // update credits
  //     await this.member.updateMemberData(dbUserId, {
  //       total_credits: parseFloat(user.total_credits) + parseFloat(formattedAmount),
  //     });

  //     const invoice = await this.paymentMethodModel.getInvoiceById(
  //             invoiceId
  //           );
  //           if (!invoice) {
  //             return res
  //               .status(200)
  //               .json({ status: 0, msg: "Invoice not found." });
  //           }

  //     // update invoice
  //     const updateResult = await this.paymentMethodModel.updateInvoicePaymentDetails(invoiceId, {
  //       payment_intent_id: payment.id,
  //       payment_method_id: payment.links?.mandate || "",
  //       payment_intent: "",
  //       payment_method: "gocardless",
  //     });
  //     // console.log("updateResult:", updateResult);

  //     if (updateResult.affectedRows > 0) {
  //       await helpers.storeTransaction({
  //         user_id: dbUserId,
  //         amount: formattedAmount,
  //         payment_method: "gocardless",
  //         transaction_id: order_id && !isNaN(order_id) ? parseInt(order_id, 10) : null,
  //         created_time: helpers.getUtcTimeInSeconds(),
  //         payment_intent_id: "",
  //         payment_method_id: payment.links?.mandate || "",
  //         type: "credits",
  //         status: "confirmed"
  //       });

  //       // console.log("Transaction recorded");

  //       await this.pageModel.insertInCredits({
  //         user_id: dbUserId,
  //         type: "user",
  //         credits: formattedAmount,
  //         created_date: helpers.getUtcTimeInSeconds(),
  //         e_type: "credit",
  //       });
  //       // console.log("Credit entry added");


  //       console.log(`🎉 Invoice ${invoiceId} marked as paid & credits added.`);
  //     } else {
  //       console.error(`❌ Failed to update invoice ${invoiceId}`);
  //     }
  //   }






  //   async confirmPayment(paymentId) {
  //     console.log("paymentId:",paymentId)
  //   try {
  //     const resp = await client.payments.confirm(paymentId);
  //     console.log("✅ Payment force confirmed:", resp);
  //   } catch (err) {
  //     console.error("❌ Error confirming payment:", err.message);
  //   }
  // }


  async createRequestQuoteForPendingJobs(req, res) {
    this.tokenModel = new Token();

    try {
      let payment_intent_id = null;
      let payment_methodid = null;
      // Destructure necessary fields from req.body
      const {

        payment_intent_id: frontend_payment_intent_id,
        customer_id,
        order_id,
        saved_card_id,
        payment_method,
        payment_method_id,

      } = req.body;

      let clientSecret = "";
      payment_methodid = payment_method_id;
      let payment_intent = frontend_payment_intent_id;
      const requestQuote = await RequestQuoteModel.getRequestQuoteById(order_id);
      if (!requestQuote) {
        return res
          .status(200)
          .json({ status: 0, msg: "Request quote not found." });
      }
      // ✅ Check if order is already paid
      if (requestQuote[0].status === "paid") {
        return res.status(200).json({
          status: 0,
          msg: "This order has already been paid. Payment is not allowed again.",
        });
      }
      // ✅ Check if start_date is in the future
      const startDate = new Date(requestQuote[0].start_date);
      const today = new Date();

      // Normalize time (important)
      startDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (startDate <= today) {
        return res.status(200).json({
          status: 0,
          msg: "Payment is not allowed because the job start date has already passed.",
        });
      }
      const userRow = await this.member.findById(requestQuote?.user_id);
      // ✅ DEFINE IT ONCE
      const formattedTotalAmount = parseFloat(requestQuote[0].total_amount);
      if (isNaN(formattedTotalAmount)) {
        return res.status(200).json({ status: 0, msg: "Invalid total amount." });
      }

      const userId = requestQuote[0].user_id

      if (payment_method === "credit-card") {
        const updateData = {

          payment_intent: payment_intent,// <-- store Stripe paymentIntent.id
          payment_method: "credit-card",
          customer_id: customer_id,            // <-- store Stripe customer_id returned from create-payment-intent
          payment_method_id: payment_methodid, // <-- frontend already sends this
          status: 'paid'

        }

        await this.member.updateRequestQuoteData(
          order_id,
          updateData
        );

      } else if (payment_method === "saved-card") {
        if (!saved_card_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Card is required." });
        }
        // console.log('Saved Card ID before decoding:', saved_card_id);

        // Decode the saved card ID
        const decodedId = helpers.doDecode(saved_card_id);
        // console.log('Decoded ID:', decodedId); // Check decoded value

        if (!decodedId) {
          return res.status(200).json({ status: 0, msg: "Invalid Card." });
        }

        // Fetch the payment method from the database
        const paymentMethod =
          await this.paymentMethodModel.getPaymentMethodById(decodedId);
        // console.log(paymentMethod,"payment method");

        if (!paymentMethod) {
          return res.status(200).json({ status: 0, msg: "Card not found." });
        }

        // Decode Stripe payment method ID stored in the database
        const stripe_payment_method_id = helpers.doDecode(
          paymentMethod?.payment_method_id
        );
        if (!stripe_payment_method_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid Stripe Payment Method ID." });
        }

        // Retrieve the payment method details from Stripe
        let stripePaymentMethod;
        try {
          stripePaymentMethod = await stripe.paymentMethods.retrieve(
            stripe_payment_method_id
          );
        } catch (error) {
          return res.status(200).json({
            status: 0,
            msg: "Error retrieving Stripe payment method.",
            error: error.message,
          });
        }

        // Ensure the payment method is attached to a customer
        if (!stripePaymentMethod || !stripePaymentMethod.customer) {
          return res.status(200).json({
            status: 0,
            msg: "Payment method is not linked to a customer.",
          });
        }

        // Create a payment intent to charge the user
        let paymentIntent;
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(formattedTotalAmount * 100),
            currency: "usd",
            customer: stripePaymentMethod.customer,
            payment_method: stripe_payment_method_id,
            confirm: true,
            use_stripe_sdk: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",
            },
            metadata: { user_id: userId },
          });
        } catch (error) {
          console.error("Stripe Error:", error);
          return res.status(200).json({
            status: 0,
            msg: "Error creating payment intent.",
            error: error.message,
          });
        }

        // Check the payment status
        if (paymentIntent.status !== "succeeded") {
          return res.status(200).json({
            status: 0,
            msg: "Payment failed.",
            paymentStatus: paymentIntent.status,
          });
        }
        // payment_intent_id = paymentIntent.id;
        payment_intent = paymentIntent.id;
        payment_methodid = stripe_payment_method_id;
        // Prepare the object for requestQuoteId insertion

        const updateData = {


          // payment_intent: paymentIntent.id, // Store the Payment Intent ID
          payment_intent: payment_intent,

          customer_id: stripePaymentMethod.customer, // Store the Customer ID
          payment_method_id: stripe_payment_method_id, // Store the Stripe Payment Method ID

          payment_method,
          status: 'paid'

        };
        await this.member.updateRequestQuoteData(
          order_id,
          updateData
        );



      }



      // Send success response
      res.status(200).json({
        status: 1,
        order_id: order_id,
        msg:
          payment_method === "paypal"
            ? "Your order is ready. You will now be redirected to complete the payment."
            : "Payment successful! Your order is now confirmed.",
        data: {
          requestId: helpers.doEncode(order_id),
        },
      });

    } catch (error) {
      console.error("Error in createRequestQuote:", error);
      res.status(200).json({
        error: "Internal server error",
        details: error.message,
        // stack: error.stack, // 👈 include stack trace temporarily
      });
    }
  }

  async deleteOrder(req, res) {
    try {
      const { token, memType, order_id } = req.body;

      if (!token) {
        return res.status(400).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
        return res.status(200).json({
          status: 0,
          msg: "Rider account cannot delete request!",
        });
      }

      // Validate token and get member info
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const member = userResponse.user; // logged-in member info
      const userId = member.id;

      if (!order_id) {
        return res.status(200).json({ status: 0, msg: "Order ID is required." });
      }

      // Check if order exists and belongs to this member
      const order = await RequestQuoteModel.getRequestQuoteById(order_id);
      if (!order || order.user_id !== userId) {
        return res.status(200).json({
          status: 0,
          msg: "Order not found or not authorized.",
        });
      }

      // Delete the order
      await RequestQuoteModel.deleteRequestQuote(order_id);

      return res.status(200).json({
        status: 1,
        msg: "Order deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message,
      });
    }
  }



  async createRequestQuote(req, res) {
    this.tokenModel = new Token();

    try {
      let payment_intent_id = null;
      let payment_methodid = null;
      // Destructure necessary fields from req.body
      const {
        token,
        payment_intent_customer_id,
        // payment_intent_id,   // coming from frontend
        payment_intent_id: frontend_payment_intent_id,
        customer_id,
        selectedVehicle,
        remote_price,
        rider_price,
        price,
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
        source_lat,
        source_long,
        payment_method,
        payment_method_id,
        vias,
        memType,
        date,
        notes,
        saved_card_id,
        order_details,
        promo_code,
        totalDistance,
        pickup_time_option,
        pickup_start_date,
        pickup_start_time,
        pickup_end_date,
        pickup_end_time,
        delivery_time_option,
        delivery_start_date,
        delivery_start_time,
        delivery_end_date,
        delivery_end_time,
        pickup_time,
        pickup_date,
        delivery_time,
        delivery_date,
        full_name,
        email,
        password,
        confirm_password,
        fingerprint,
        is_ready,
        is_on_the_way,
        ready_time,
        via_pickup_time_option,
        via_delivery_option,
        via_pickup_time,
        via_pickup_date,
        via_pickup_start_date,
        via_pickup_end_date,
        round_trip,
        handball_work
      } = req.body;

      // console.log("handball_work:", req.body.handball_work);



      const requiredFields = [
        "selectedVehicle",
        // "price",
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
        "card_holder_name",
        "confirm",
        "totalAmount",
        "payment_method",
        "payment_method_id",
      ];
      // console.log(
      //   "Req.body vias:",
      //  vias
      // );
      let userId = null;
      let token_arr = {};
      let member = null; // 🟩 Add this

      let isSignup = false;


      if (token) {
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
        // Now you have the user (member) and their ID, use member.id instead of user.id
        userId = member.id;
      }
      else if (payment_method === 'paypal' || payment_method === 'apple-pay') {

        if (!token) {
          requiredFields.push("full_name", "email", "password", "confirm_password");
        }

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
        const userExist = await this.member.findByEmail(email);
        if (userExist) {
          return res
            .status(200)
            .json({ status: 0, msg: "User already exists! Please login to continue!" });
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

        isSignup = true; // Mark as signup

        // console.log("User created with ID:", userId);
      }
      else if (token === undefined || token === "") {
        if (!token) {
          return res.status(200).json({ status: 0, msg: "Token is required." });
        }
      }

      const outstanding = await this.member.getOutstandingAmount(userId);

      if (outstanding > 0) {
        return res.status(200).json({
          status: 0,
          msg: `You have unpaid dues of ${outstanding}. Please clear before creating a job.`
        });
      }

      // Generate token for user if not provided
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment

      // Generate a random number and create the token
      const randomNum = crypto.randomBytes(16).toString("hex");
      const tokenType = "user";
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Token expires in 1 hour

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
      // Send email **only if this is signup**
      if (isSignup) {
        let adminData = res.locals.adminData;
        const otp = Math.floor(100000 + Math.random() * 900000);

        const subject = "Verify Your Email - " + adminData.site_name;
        const templateData = {
          username: full_name, // Pass username
          otp: otp, // Pass OTP
          adminData,
        };
        // console.log("Sending verification email to:", email);

        const result = await helpers.sendEmail(
          email,
          subject,
          "email-verify",
          templateData
        );
      }

      let parcelsArr = [];
      let viasArr = [];
      if (parcels) {
        parcelsArr = JSON.parse(parcels);
      }
      if (vias) {
        viasArr = JSON.parse(vias);
      }
      // console.log(parcels);return;
      // Validate parcels
      if (!Array.isArray(parcelsArr)) {
        return res
          .status(200)
          .json({ status: 0, msg: "'parcels' must be an array" });
      }
      const siteSettings = res.locals.adminData;
      let order_amount_details = await helpers.calculateOrderTotal(
        totalDistance,
        siteSettings,
        price,
        remote_price,
        selectedVehicle,
        handball_work
      );

      // console.log("order_amount_details:", order_amount_details);return;
      let total_distance = order_amount_details?.totalDistance;
      let total_amount = Number(order_amount_details.totalAmount);
      let taxAmount = Number(order_amount_details.taxAmount);
      let vatAmount = Number(order_amount_details.vatAmount);
      let grandTotal = Number(order_amount_details.grandTotal);

      // console.log(order_amount_details);return;
      const parsedStartDate = date ? new Date(date) : null;

      // if (!parsedStartDate || isNaN(parsedStartDate)) {
      //   return res
      //     .status(200)
      //     .json({ status: 0, msg: "Invalid start_date format" });
      // }

      let parcel_price_obj = helpers.calculateParcelsPrice(
        order_details,
        siteSettings?.site_processing_fee
      );

      const formattedRiderPrice = parseFloat(rider_price || 0);
      const formattedVehiclePrice = parseFloat(price || 0);
      let formattedTotalAmount = parseFloat(grandTotal || 0);
      const formattedTax = parseFloat(taxAmount || 0);
      const formattedVat = parseFloat(vatAmount || 0);



      let discount = 0;

      // console.log(formattedTotalAmount,formattedTax);return;
      if (
        promo_code !== "" &&
        promo_code !== null &&
        promo_code !== "null" &&
        promo_code !== undefined
      ) {
        const promo = await this.promoCodeModel.findByCode(promo_code);

        if (!promo) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid promo code." });
        }

        const currentDate = new Date();
        if (promo.expiry_date && new Date(promo.expiry_date) < currentDate) {
          return res.status(200).json({ error: "Promo code has expired." });
        }

        if (promo.promo_code_type === "percentage") {
          discount = (total_amount * promo.percentage_value) / 100;
        } else if (promo.promo_code_type === "amount") {
          discount = promo.percentage_value;
        } else {
          return res.status(200).json({ error: "Promo code has expired." });
        }

        formattedTotalAmount = total_amount - discount;
        // console.log("total_amount, discount, formattedTotalAmount :", total_amount, discount, formattedTotalAmount);
        // console.log("formattedTax :", formattedTax);

        // ✅ Ensure numeric addition
        formattedTotalAmount = parseFloat(formattedTotalAmount) + parseFloat(vatAmount);
        // console.log("formattedTotalAmount type:", formattedTotalAmount);return;

        formattedTotalAmount = parseFloat(formattedTotalAmount);
      }

      // console.log("Remote price",formattedRemotePrice)
      // console.log("Remote price",remote_price)
      let clientSecret = "";
      // let payment_intent_id = payment_intent_customer_id;
      payment_methodid = payment_method_id;
      // let payment_intent = payment_intent_id;
      let payment_intent = frontend_payment_intent_id;
      let requestQuoteId = "";
      // console.log("payment_method:", payment_method);return;
      if (payment_method === "credit-card") {
        let requestData = {
          user_id: userId, // Save the userId in the request
          selected_vehicle: selectedVehicle,
          rider_price: formattedRiderPrice,
          vehicle_price: formattedVehiclePrice,
          total_amount: formattedTotalAmount,
          tax: formattedTax,
          vat: formattedVat,

          // ⭐ ADD THESE THREE FIELDS
          payment_intent: payment_intent,      // <-- store Stripe paymentIntent.id
          customer_id: customer_id,            // <-- store Stripe customer_id returned from create-payment-intent
          payment_method_id: payment_methodid, // <-- frontend already sends this

          // payment_intent: payment_intent_customer_id,
          // customer_id: payment_intent_customer_id,
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
          source_lat,
          source_long,
          payment_method,
          is_ready: 0,
          is_on_the_way: 0,
          ready_time,
          payment_method_id: payment_methodid,
          created_date: new Date(), // Set current date as created_date
          start_date: parsedStartDate,
          notes: notes,
          promo_code: promo_code,
          discount: discount,
          request_status: "active",
          pickup_time_option,
          delivery_time_option,
          round_trip:
            round_trip === true ||
              round_trip === "true" ||
              round_trip === "yes"
              ? "yes"
              : "no",

          total_distance: total_distance,
          handball_work: Number(handball_work) === 1 ? 1 : 0

          // Pass start_date from the frontend
        };

        if (pickup_time_option === "at" || pickup_time_option === "before") {
          requestData = {
            ...requestData,
            pickup_date: helpers.convertToPostgresDate(pickup_date),
            pickup_time: helpers.convertToPostgresTime(
              pickup_time,
              pickup_date
            ),
          };
        } else if (pickup_time_option === "between") {
          requestData = {
            ...requestData,
            pickup_start_date:
              helpers.convertToPostgresDate(pickup_start_date),
            pickup_start_time: helpers.convertToPostgresTime(
              pickup_start_time,
              pickup_start_date
            ),
            pickup_end_date: helpers.convertToPostgresDate(pickup_end_date),
            pickup_end_time: helpers.convertToPostgresTime(
              pickup_end_time,
              pickup_end_date
            ),
          };
        }
        if (delivery_time_option === "at" || delivery_time_option === "by") {
          requestData = {
            ...requestData,
            delivery_time: helpers.convertToPostgresTime(
              delivery_time,
              delivery_date
            ),
            delivery_date: helpers.convertToPostgresDate(delivery_date),
          };
        } else if (delivery_time_option === "between") {
          requestData = {
            ...requestData,
            delivery_start_date:
              helpers.convertToPostgresDate(delivery_start_date),
            delivery_start_time: helpers.convertToPostgresTime(
              delivery_start_time,
              delivery_start_date
            ),
            delivery_end_date:
              helpers.convertToPostgresDate(delivery_end_date),
            delivery_end_time: helpers.convertToPostgresTime(
              delivery_end_time,
              delivery_end_date
            ),
          };
        }
        requestQuoteId = await this.pageModel.createRequestQuote(requestData);

      } else if (payment_method === "saved-card") {
        if (!saved_card_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Card is required." });
        }
        // console.log('Saved Card ID before decoding:', saved_card_id);

        // Decode the saved card ID
        const decodedId = helpers.doDecode(saved_card_id);
        // console.log('Decoded ID:', decodedId); // Check decoded value

        if (!decodedId) {
          return res.status(200).json({ status: 0, msg: "Invalid Card." });
        }

        // Fetch the payment method from the database
        const paymentMethod =
          await this.paymentMethodModel.getPaymentMethodById(decodedId);
        // console.log(paymentMethod,"payment method");

        if (!paymentMethod) {
          return res.status(200).json({ status: 0, msg: "Card not found." });
        }

        // Decode Stripe payment method ID stored in the database
        const stripe_payment_method_id = helpers.doDecode(
          paymentMethod?.payment_method_id
        );
        if (!stripe_payment_method_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid Stripe Payment Method ID." });
        }

        // Retrieve the payment method details from Stripe
        let stripePaymentMethod;
        try {
          stripePaymentMethod = await stripe.paymentMethods.retrieve(
            stripe_payment_method_id
          );
        } catch (error) {
          return res.status(200).json({
            status: 0,
            msg: "Error retrieving Stripe payment method.",
            error: error.message,
          });
        }

        // Ensure the payment method is attached to a customer
        if (!stripePaymentMethod || !stripePaymentMethod.customer) {
          return res.status(200).json({
            status: 0,
            msg: "Payment method is not linked to a customer.",
          });
        }

        // Create a payment intent to charge the user
        let paymentIntent;
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(formattedTotalAmount * 100),
            currency: "usd",
            customer: stripePaymentMethod.customer,
            payment_method: stripe_payment_method_id,
            confirm: true,
            use_stripe_sdk: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",
            },
            metadata: { user_id: userId },
          });
        } catch (error) {
          console.error("Stripe Error:", error);
          return res.status(200).json({
            status: 0,
            msg: "Error creating payment intent.",
            error: error.message,
          });
        }

        // Check the payment status
        if (paymentIntent.status !== "succeeded") {
          return res.status(200).json({
            status: 0,
            msg: "Payment failed.",
            paymentStatus: paymentIntent.status,
          });
        }
        // payment_intent_id = paymentIntent.id;
        payment_intent = paymentIntent.id;
        payment_methodid = stripe_payment_method_id;
        // Prepare the object for requestQuoteId insertion

        let requestData = {
          user_id: userId,
          selected_vehicle: selectedVehicle,
          rider_price: formattedRiderPrice,
          vehicle_price: formattedVehiclePrice,
          total_amount: formattedTotalAmount,
          tax: formattedTax,
          vat: formattedVat,

          // payment_intent: paymentIntent.id, // Store the Payment Intent ID
          payment_intent: payment_intent,

          customer_id: stripePaymentMethod.customer, // Store the Customer ID
          payment_method_id: stripe_payment_method_id, // Store the Stripe Payment Method ID
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
          source_lat,
          source_long,
          is_ready: 0,
          is_on_the_way: 0,
          ready_time,
          payment_method,
          saved_card_id, // Store the saved card ID
          created_date: new Date(),
          start_date: new Date(date),
          notes: notes,
          promo_code: promo_code,
          discount: discount,
          request_status: "active",
          pickup_time_option,
          round_trip:
            round_trip === true ||
              round_trip === "true" ||
              round_trip === "yes"
              ? "yes"
              : "no",
          handball_work: Number(handball_work) === 1 ? 1 : 0,


          delivery_time_option,
          total_distance: total_distance
        };
        if (pickup_time_option === "at" || pickup_time_option === "before") {
          // console.log("pickup_time,pickup_date", pickup_time, pickup_date);
          requestData = {
            ...requestData,
            pickup_date: helpers.convertToPostgresDate(pickup_date),
            pickup_time: helpers.convertToPostgresTime(
              pickup_time,
              pickup_date
            ),
          };
        } else if (pickup_time_option === "between") {
          requestData = {
            ...requestData,
            pickup_start_date:
              helpers.convertToPostgresDate(pickup_start_date),
            pickup_start_time: helpers.convertToPostgresTime(
              pickup_start_time,
              pickup_start_date
            ),
            pickup_end_date: helpers.convertToPostgresDate(pickup_end_date),
            pickup_end_time: helpers.convertToPostgresTime(
              pickup_end_time,
              pickup_end_date
            ),
          };
        }
        if (delivery_time_option === "at" || delivery_time_option === "by") {
          requestData = {
            ...requestData,
            delivery_time: helpers.convertToPostgresTime(
              delivery_time,
              delivery_date
            ),
            delivery_date: helpers.convertToPostgresDate(delivery_date),
          };
        } else if (delivery_time_option === "between") {
          requestData = {
            ...requestData,
            delivery_start_date:
              helpers.convertToPostgresDate(delivery_start_date),
            delivery_start_time: helpers.convertToPostgresTime(
              delivery_start_time,
              delivery_start_date
            ),
            delivery_end_date:
              helpers.convertToPostgresDate(delivery_end_date),
            delivery_end_time: helpers.convertToPostgresTime(
              delivery_end_time,
              delivery_end_date
            ),
          };
        }
        requestQuoteId = await this.pageModel.createRequestQuote(requestData);

      } else if (payment_method === "credits") {
        if (member?.total_credits <= 0) {
          return res
            .status(200)
            .json({ status: 0, msg: "Insufficient balance!" });
        }
        if (member?.total_credits < parseFloat(formattedTotalAmount)) {
          return res
            .status(200)
            .json({ status: 0, msg: "Insufficient balance!" });
        }

        payment_intent_id = "";
        payment_methodid = "";
        // Prepare the object for requestQuoteId insertion
        let requestData = {
          user_id: userId,
          selected_vehicle: selectedVehicle,
          rider_price: formattedRiderPrice,
          vehicle_price: formattedVehiclePrice,
          total_amount: formattedTotalAmount,
          tax: formattedTax,
          vat: formattedVat,

          payment_intent: "", // Store the Payment Intent ID
          customer_id: "", // Store the Customer ID
          payment_method_id: "", // Store the Stripe Payment Method ID
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
          source_lat,
          source_long,
          is_ready: 0,
          is_on_the_way: 0,
          ready_time,
          payment_method,
          created_date: new Date(),
          start_date: new Date(date),
          notes: notes,
          promo_code: promo_code,
          discount: discount,
          request_status: "active",
          pickup_time_option,

          delivery_time_option,
          round_trip:
            round_trip === true ||
              round_trip === "true" ||
              round_trip === "yes"
              ? "yes"
              : "no",
          handball_work: Number(handball_work) === 1 ? 1 : 0,

          total_distance: total_distance
        };

        if (pickup_time_option === "at" || pickup_time_option === "before") {
          requestData = {
            ...requestData,
            pickup_date: helpers.convertToPostgresDate(pickup_date),
            pickup_time: helpers.convertToPostgresDate(
              pickup_time,
              pickup_date
            ),
          };
        } else if (pickup_time_option === "between") {
          requestData = {
            ...requestData,
            pickup_start_date:
              helpers.convertToPostgresDate(pickup_start_date),
            pickup_start_time: helpers.convertToPostgresTime(
              pickup_start_time,
              pickup_start_date
            ),
            pickup_end_date: helpers.convertToPostgresDate(pickup_end_date),
            pickup_end_time: helpers.convertToPostgresTime(
              pickup_end_time,
              pickup_end_date
            ),
          };
        }
        if (delivery_time_option === "at" || delivery_time_option === "by") {
          requestData = {
            ...requestData,
            delivery_time: helpers.convertToPostgresTime(
              delivery_time,
              delivery_date
            ),
            delivery_date: helpers.convertToPostgresDate(delivery_date),
          };
        } else if (delivery_time_option === "between") {
          requestData = {
            ...requestData,
            delivery_start_date:
              helpers.convertToPostgresDate(delivery_start_date),
            delivery_start_time: helpers.convertToPostgresTime(
              delivery_start_time,
              delivery_start_date
            ),
            delivery_end_date:
              helpers.convertToPostgresDate(delivery_end_date),
            delivery_end_time: helpers.convertToPostgresTime(
              delivery_end_time,
              delivery_end_date
            ),
          };
        }
        requestQuoteId = await this.pageModel.createRequestQuote(requestData);
      } else if (payment_method === "paypal") {
        payment_intent_id = "";
        payment_methodid = "";
        // Prepare the object for requestQuoteId insertion
        let requestData = {
          user_id: userId,
          selected_vehicle: selectedVehicle,
          rider_price: formattedRiderPrice,
          vehicle_price: formattedVehiclePrice,
          total_amount: formattedTotalAmount,
          tax: formattedTax,
          vat: formattedVat,

          payment_intent: "", // Store the Payment Intent ID
          customer_id: "", // Store the Customer ID
          payment_method_id: "", // Store the Stripe Payment Method ID
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
          source_lat,
          source_long,
          is_ready: 0,
          is_on_the_way: 0,
          ready_time,
          payment_method,
          created_date: new Date(),
          start_date: new Date(date),
          notes: notes,
          status: "pending",
          promo_code: promo_code,
          discount: discount,
          request_status: "active",
          pickup_time_option,
          round_trip:
            round_trip === true ||
              round_trip === "true" ||
              round_trip === "yes"
              ? "yes"
              : "no",
          handball_work: Number(handball_work) === 1 ? 1 : 0,


          delivery_time_option,
          total_distance: total_distance
        };
        if (pickup_time_option === "at" || pickup_time_option === "before") {
          requestData = {
            ...requestData,
            pickup_date: helpers.convertToPostgresDate(pickup_date),
            pickup_time: helpers.convertToPostgresDate(
              pickup_time,
              pickup_date
            ),
          };
        } else if (pickup_time_option === "between") {
          requestData = {
            ...requestData,
            pickup_start_date:
              helpers.convertToPostgresDate(pickup_start_date),
            pickup_start_time: helpers.convertToPostgresTime(
              pickup_start_time,
              pickup_start_date
            ),
            pickup_end_date: helpers.convertToPostgresDate(pickup_end_date),
            pickup_end_time: helpers.convertToPostgresTime(
              pickup_end_time,
              pickup_end_date
            ),
          };
        }
        if (delivery_time_option === "at" || delivery_time_option === "by") {
          requestData = {
            ...requestData,
            delivery_time: helpers.convertToPostgresTime(
              delivery_time,
              delivery_date
            ),
            delivery_date: helpers.convertToPostgresDate(delivery_date),
          };
        } else if (delivery_time_option === "between") {
          requestData = {
            ...requestData,
            delivery_start_date:
              helpers.convertToPostgresDate(delivery_start_date),
            delivery_start_time: helpers.convertToPostgresTime(
              delivery_start_time,
              delivery_start_date
            ),
            delivery_end_date:
              helpers.convertToPostgresDate(delivery_end_date),
            delivery_end_time: helpers.convertToPostgresTime(
              delivery_end_time,
              delivery_end_date
            ),
          };
        }
        requestQuoteId = await this.pageModel.createRequestQuote(requestData);
      } else if (payment_method === "gocardless") {

        payment_intent_id = "";
        payment_methodid = "";
        // Prepare the object for requestQuoteId insertion
        let requestData = {
          user_id: userId,
          selected_vehicle: selectedVehicle,
          rider_price: formattedRiderPrice,
          vehicle_price: formattedVehiclePrice,
          total_amount: formattedTotalAmount,
          tax: formattedTax,
          vat: formattedVat,

          payment_intent: "", // Store the Payment Intent ID
          customer_id: "", // Store the Customer ID
          payment_method_id: "", // Store the Stripe Payment Method ID
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
          source_lat,
          source_long,
          payment_method,
          created_date: new Date(),
          start_date: new Date(date),
          notes: notes,
          status: "pending",
          promo_code: promo_code,
          discount: discount,
          request_status: "active",
          pickup_time_option,
          round_trip:
            round_trip === true ||
              round_trip === "true" ||
              round_trip === "yes"
              ? "yes"
              : "no",
          handball_work: Number(handball_work) === 1 ? 1 : 0,


          delivery_time_option,
          total_distance: total_distance
        };
        if (pickup_time_option === "at" || pickup_time_option === "before") {
          requestData = {
            ...requestData,
            pickup_date: helpers.convertToPostgresDate(pickup_date),
            pickup_time: helpers.convertToPostgresDate(
              pickup_time,
              pickup_date
            ),
          };
        } else if (pickup_time_option === "between") {
          requestData = {
            ...requestData,
            pickup_start_date:
              helpers.convertToPostgresDate(pickup_start_date),
            pickup_start_time: helpers.convertToPostgresTime(
              pickup_start_time,
              pickup_start_date
            ),
            pickup_end_date: helpers.convertToPostgresDate(pickup_end_date),
            pickup_end_time: helpers.convertToPostgresTime(
              pickup_end_time,
              pickup_end_date
            ),
          };
        }
        if (delivery_time_option === "at" || delivery_time_option === "by") {
          requestData = {
            ...requestData,
            delivery_time: helpers.convertToPostgresTime(
              delivery_time,
              delivery_date
            ),
            delivery_date: helpers.convertToPostgresDate(delivery_date),
          };
        } else if (delivery_time_option === "between") {
          requestData = {
            ...requestData,
            delivery_start_date:
              helpers.convertToPostgresDate(delivery_start_date),
            delivery_start_time: helpers.convertToPostgresTime(
              delivery_start_time,
              delivery_start_date
            ),
            delivery_end_date:
              helpers.convertToPostgresDate(delivery_end_date),
            delivery_end_time: helpers.convertToPostgresTime(
              delivery_end_time,
              delivery_end_date
            ),
          };
        }
        // console.log("GoCardless requestData:", requestData);return;
        requestQuoteId = await this.pageModel.createRequestQuote(requestData);
        // console.log("GoCardless requestQuoteId:", requestQuoteId);
      } else if (payment_method === "apple-pay") {
        try {
          payment_intent_id = "";
          payment_methodid = "";
          // Prepare the object for requestQuoteId insertion
          let requestData = {
            user_id: userId,
            selected_vehicle: selectedVehicle,
            rider_price: formattedRiderPrice,
            vehicle_price: formattedVehiclePrice,
            total_amount: formattedTotalAmount,
            tax: formattedTax,
            vat: formattedVat,

            payment_intent: "", // Store the Payment Intent ID
            customer_id: "", // Store the Customer ID
            payment_method_id: "", // Store the Stripe Payment Method ID
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
            source_lat,
            source_long,
            is_ready: 0,
            is_on_the_way: 0,
            ready_time,
            payment_method,
            created_date: new Date(),
            start_date: new Date(date),
            notes: notes,
            promo_code: promo_code,
            discount: discount,
            request_status: "active",
            pickup_time_option,

            delivery_time_option,
            round_trip:
              round_trip === true ||
                round_trip === "true" ||
                round_trip === "yes"
                ? "yes"
                : "no",
            handball_work: Number(handball_work) === 1 ? 1 : 0,

            total_distance: total_distance
          };
          if (
            pickup_time_option === "at" ||
            pickup_time_option === "before"
          ) {
            requestData = {
              ...requestData,
              pickup_date: helpers.convertToPostgresDate(pickup_date),
              pickup_time: helpers.convertToPostgresDate(
                pickup_time,
                pickup_date
              ),
            };
          } else if (pickup_time_option === "between") {
            requestData = {
              ...requestData,
              pickup_start_date:
                helpers.convertToPostgresDate(pickup_start_date),
              pickup_start_time: helpers.convertToPostgresTime(
                pickup_start_time,
                pickup_start_date
              ),
              pickup_end_date: helpers.convertToPostgresDate(pickup_end_date),
              pickup_end_time: helpers.convertToPostgresTime(
                pickup_end_time,
                pickup_end_date
              ),
            };
          }
          if (
            delivery_time_option === "at" ||
            delivery_time_option === "by"
          ) {
            requestData = {
              ...requestData,
              delivery_time: helpers.convertToPostgresTime(
                delivery_time,
                delivery_date
              ),
              delivery_date: helpers.convertToPostgresDate(delivery_date),
            };
          } else if (delivery_time_option === "between") {
            requestData = {
              ...requestData,
              delivery_start_date:
                helpers.convertToPostgresDate(delivery_start_date),
              delivery_start_time: helpers.convertToPostgresTime(
                delivery_start_time,
                delivery_start_date
              ),
              delivery_end_date:
                helpers.convertToPostgresDate(delivery_end_date),
              delivery_end_time: helpers.convertToPostgresTime(
                delivery_end_time,
                delivery_end_date
              ),
            };
          }

          requestQuoteId = await this.pageModel.createRequestQuote(
            requestData
          );

        } catch (error) {
          console.error("Stripe Error:", error);
          return res.status(200).json({
            status: 0,
            msg: "Error creating payment intent.",
            error: error.message,
          });
        }
      }

      // console.log("pickup_start_date:",
      //           helpers.convertToPostgresDate(pickup_start_date),
      //         "pickup_end_date:", helpers.convertToPostgresDate(pickup_end_date));return;

      // Create Request Quote record

      // Create Parcels records for the request
      const parcelRecords = parcelsArr.map((parcel) => ({
        request_id: requestQuoteId,
        length: parcel.length,
        width: parcel.width ? parcel.width : null,
        height: parcel.height ? parcel.height : null,
        weight: parcel.weight || null,
        quantity: parcel.quantity || null,
        destination: parcel.destination,
        source: parcel.source,
        parcelNumber: parcel.parcelNumber,
        distance: parcel.distance,
        parcelType: parcel.parcelType,
        postcode: parcel.postcode,
        parcel_round_trip: parcel.parcel_round_trip || 0,
      }));
      // console.log("parcelRecords:", parcelRecords);return;
      // console.log("requestQuoteId:", requestQuoteId);return;


      // Insert parcels into the database
      await this.pageModel.insertParcels(parcelRecords);
      // console.log("viasArr:", viasArr);return;

      const viaRecords = viasArr.map((via) => {
        const commonFields = {
          request_id: requestQuoteId,
          full_name: via.full_name,
          phone_number: via.phone_number,
          post_code: via.post_code,
          address: via.address,
          city: via.city,

          via_pickup_time_option: via.via_pickup_time_option,
          via_delivery_option: via.via_delivery_option,
        };
        // console.log("requestQuoteId:", requestQuoteId);return;


        // Condition for "at" or "before"
        if (["at", "before"].includes(via.via_pickup_time_option)) {
          return {
            ...commonFields,
            via_pickup_date: helpers.convertToPostgresDate(
              via.via_pickup_date
            ),
            via_pickup_time: helpers.convertToPostgresTime(
              via.via_pickup_time,
              via.via_pickup_date
            ),

            // These fields will be null
            via_pickup_start_date: null,
            via_pickup_start_time: null,
            via_pickup_end_date: null,
            via_pickup_end_time: null,
          };
        }

        // Condition for "between"
        if (via.via_pickup_time_option === "between") {
          //             console.log("🟢 via_pickup_start_date before convert:", via.via_pickup_start_date, "-> type:", typeof via.via_pickup_start_date);
          //   console.log("🟢 via_pickup_end_date before convert:", via.via_pickup_end_date, "-> type:", typeof via.via_pickup_end_date);

          //   const startDate = helpers.convertToPostgresDate(via.via_pickup_start_date);
          // const endDate = helpers.convertToPostgresDate(via.via_pickup_end_date);

          // console.log("✅ Converted via_pickup_start_date:", startDate);
          // console.log("✅ Converted via_pickup_end_date:", endDate);

          return {
            ...commonFields,
            via_pickup_date: null,
            via_pickup_time: null,

            via_pickup_start_date: helpers.convertToPostgresDate(
              via.via_pickup_start_date
            ),
            via_pickup_start_time: helpers.convertToPostgresTime(
              via.via_pickup_start_time,
              via.via_pickup_start_date
            ),
            via_pickup_end_date: helpers.convertToPostgresDate(
              via.via_pickup_end_date
            ),
            via_pickup_end_time: helpers.convertToPostgresTime(
              via.via_pickup_end_time,
              via.via_pickup_end_date
            ),
          };
        }

        // Default fallback (if time_option is unrecognized)
        return {
          ...commonFields,
          via_pickup_date: null,
          via_pickup_time: null,
          via_pickup_start_date: null,
          via_pickup_start_time: null,
          via_pickup_end_date: null,
          via_pickup_end_time: null,
        };
      });
      // console.log("via object:", viaRecords);return;

      // console.log("viaRecords:", viaRecords);
      // Insert parcels into the database
      await this.pageModel.insertVias(viaRecords);

      let parsedOrderDetails = [];
      try {
        parsedOrderDetails = JSON.parse(order_details);
      } catch (err) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid order_details format" });
      }

      if (!Array.isArray(parsedOrderDetails)) {
        return res
          .status(200)
          .json({ status: 0, msg: "'order_details' must be an array" });
      }

      // console.log("Order Details:", parsedOrderDetails);return;

      // Prepare order_details records
      const orderDetailsRecords = parsedOrderDetails.map((detail) => ({
        order_id: requestQuoteId,
        source_address: detail.source,
        destination_address: detail.destination,
        distance: detail.distance,
        height: detail.height || null,
        length: detail.length || null,
        width: detail.width || null,
        weight: detail.weight || null,
        quantity: detail.quantity || null,
        parcel_number: detail.parcelNumber,
        parcel_type: detail.parcelType,
        price: parseFloat(detail?.price),
        source_lat: detail?.source_lat,
        source_lng: detail?.source_lng,
        // source_long: detail?.source_long,
        destination_lat: detail?.destination_lat,
        destination_lng: detail?.destination_lng,
      }));
      // console.log("Order Details Records:", orderDetailsRecords);return;



      // Insert order details into the database
      await this.pageModel.insertOrderDetails(orderDetailsRecords);

      // const unique_addresses = helpers.getUniqueAddresses(orderDetailsRecords);
      const unique_addresses = helpers.getUniqueAddresses(orderDetailsRecords, source_full_address);
      console.log(unique_addresses);

      await this.pageModel.insertRequestStages(unique_addresses, requestQuoteId);

      // console.log(userId, parcel_price_obj?.total, payment_method, requestQuoteId);
      if (payment_method === "credits") {
        await this.member.updateMemberData(member?.id, {
          total_credits:
            parseFloat(member?.total_credits) -
            parseFloat(formattedTotalAmount),
        });
        const createdDate = helpers.getUtcTimeInSeconds();

        const creditEntry = {
          user_id: userId,
          type: "user", // Change type to 'user' as per requirement
          credits: formattedTotalAmount, // Credits used by the user
          created_date: createdDate,
          e_type: "debit", // Debit type entry
        };

        await this.pageModel.insertInCredits(creditEntry);
        //   console.log("credit entry:",await this.pageModel.insertInCredits(creditEntry)
        // )
        //   return;
      }
      // console.log(req.body)
      //  return;
      let apple_obj = {};
      if (payment_method === "apple-pay") {
        // console.log("formattedTotalAmount:", formattedTotalAmount);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(formattedTotalAmount * 100), // Convert amount to cents (for Stripe)
          currency: "gbp",
          metadata: {
            order_id: requestQuoteId, // Pass the order_id from your database
          },
          payment_method_types: ["card"],
        });
        clientSecret = paymentIntent?.client_secret;
        apple_obj = {
          clientSecret: clientSecret,
          order_id: requestQuoteId,
          amount: parseFloat(formattedTotalAmount),
        };

      } else if (payment_method === "gocardless") {
        const orderDetailsLink = `/rider-dashboard/jobs`;

        const ridersInCity = await this.rider.getRidersByCity(source_city);

        if (ridersInCity && ridersInCity.length > 0) {
          const notificationText = `A new request has been created in your city: ${source_city}`;

          // Loop through each rider and send a notification
          for (const rider of ridersInCity) {
            const riderId = rider.id;
            // console.log(riderId,member?.id);return;

            await helpers.storeNotification(
              riderId,
              "rider", // mem_type
              member?.id, // sender (the requester)
              notificationText,
              orderDetailsLink
            );

            let orderRow = await this.member.getUserOrderDetailsByIdGoCardless({
              userId: userId,
              requestId: requestQuoteId,
            });
            // console.log("orderRow",orderRow);
            // console.log("requestQuoteId",userId, requestQuoteId);


            const parcelsArray = await this.rider.getParcelDetailsByQuoteId(
              orderRow.id
            );
            const order_stages_arr = await this.rider.getRequestOrderStages(orderRow.id);
            orderRow = {
              ...orderRow,
              parcels: parcelsArray,
              order_stages: order_stages_arr,
              start_date: helpers.formatDateToUK(orderRow.start_date),
              // ✅ ensure proper numeric formatting
              total_amount: helpers.formatAmount(orderRow.total_amount),
              tax: helpers.formatAmount(orderRow.tax),

              distance: helpers.formatAmount(orderRow.distance),
            };
            // console.log("siteSettings:",siteSettings)

            await helpers.sendEmail(
              rider.email,
              "New Order Requests - FastUk",
              "request-quote",
              {
                adminData: siteSettings,
                order: orderRow,
                type: "rider",
              }
            );
            // console.log("details:",
            //   await helpers.sendEmail(
            //     rider.email,
            //     "New Order Requests - FastUk",
            //     "request-quote",
            //     {
            //       adminData: siteSettings,
            //       order: orderRow,
            //       type: "rider",
            //     }
            //   )
            // )
          }
        };

        const created_time = helpers.getUtcTimeInSeconds();

        // Insert Transaction Record
        await helpers.storeTransactionLogs({
          user_id: userId,
          amount: formattedTotalAmount,
          payment_method: payment_method,
          transaction_id: requestQuoteId,
          created_time: created_time,
          status: "paid",
          payment_intent_id: payment_intent_id,
          payment_method_id: payment_methodid,
          type: "Request Quote",
        });
        let orderRow = await RequestQuoteModel.getOrderDetailsById(
          requestQuoteId
        );
        // console.log("orderRow",orderRow)
        const parcelsArray = await this.rider.getParcelDetailsByQuoteId(
          requestQuoteId
        );
        const order_stages_arr = await this.rider.getRequestOrderStages(requestQuoteId);
        orderRow = {
          ...orderRow,
          parcels: parcelsArray,
          order_stages: order_stages_arr,
          start_date: helpers.formatDateToUK(orderRow.start_date),
        };
        // console.log("order:", orderRow)

        const templateData = {
          username: member.full_name, // Pass username
          adminData: siteSettings,
          order: orderRow,
          type: "user",
        };
        // console.log("templateData:", templateData)

        const result = await helpers.sendEmail(
          member.email,
          "Parcel Request Confirmed: Awaiting Rider Assignment - FastUk",
          "request-quote",
          templateData
        );

      } else if (payment_method != "paypal") {
        const orderDetailsLink = `/rider-dashboard/jobs`;

        const ridersInCity = await this.rider.getRidersByCity(source_city);

        if (ridersInCity && ridersInCity.length > 0) {
          const notificationText = `A new request has been created in your city: ${source_city}`;

          // Loop through each rider and send a notification
          for (const rider of ridersInCity) {
            const riderId = rider.id;
            // console.log(riderId,member?.id);return;

            // ✅ Get rider categories
            const riderCategories = await this.rider.getRiderCategoriesById(riderId);

            // ✅ Check if selected vehicle exists in rider categories
            if (!riderCategories.includes(Number(selectedVehicle))) {
              continue; // ❌ Skip this rider
            }

            await helpers.storeNotification(
              riderId,
              "rider", // mem_type
              member?.id, // sender (the requester)
              notificationText,
              orderDetailsLink
            );

            // await helpers.sendNotification(
            //   rider.fcm_token,
            //   "New Delivery Job",
            //   "You have received a new order",
            //   {
            //     order_id: helpers.doEncode(String(orderRow.id)),
            //     screen: "OrderDetail"
            //   }
            // );

            let orderRow = await this.member.getUserOrderDetailsById({
              userId: userId,
              requestId: requestQuoteId,
            });


            const parcelsArray = await this.rider.getParcelDetailsByQuoteId(
              orderRow.id
            );
            const order_stages_arr = await this.rider.getRequestOrderStages(orderRow.id);
            orderRow = {
              ...orderRow,
              parcels: parcelsArray,
              order_stages: order_stages_arr,
              start_date: helpers.formatDateToUK(orderRow.start_date),
              // ✅ ensure proper numeric formatting
              total_amount: helpers.formatAmount(orderRow.total_amount),
              tax: helpers.formatAmount(orderRow.tax),

              distance: helpers.formatAmount(orderRow.distance),
            };
            await helpers.sendEmail(
              rider.email,
              "New Order Requests - FastUk",
              "request-quote",
              {
                adminData: siteSettings,
                order: orderRow,
                type: "rider",
              }
            );
          }
        };

        const created_time = helpers.getUtcTimeInSeconds();

        // Insert Transaction Record
        await helpers.storeTransactionLogs({
          user_id: userId,
          amount: formattedTotalAmount,
          payment_method: payment_method,
          transaction_id: requestQuoteId,
          created_time: created_time,
          status: "paid",
          payment_intent_id: payment_intent_id,
          payment_method_id: payment_methodid,
          type: "Request Quote",
        });
        let orderRow = await RequestQuoteModel.getOrderDetailsById(
          requestQuoteId
        );
        // console.log("orderRow",orderRow)
        const parcelsArray = await this.rider.getParcelDetailsByQuoteId(
          requestQuoteId
        );
        const order_stages_arr = await this.rider.getRequestOrderStages(requestQuoteId);
        orderRow = {
          ...orderRow,
          parcels: parcelsArray,
          order_stages: order_stages_arr,
          start_date: helpers.formatDateToUK(orderRow.start_date),
        };
        // console.log("order:", orderRow)

        const templateData = {
          username: member.full_name, // Pass username
          adminData: siteSettings,
          order: orderRow,
          type: "user",
        };
        // console.log("templateData:", templateData)

        const result = await helpers.sendEmail(
          member.email,
          "Parcel Request Confirmed: Awaiting Rider Assignment - FastUk",
          "request-quote",
          templateData
        );
      };
      // return;
      // console.log("Successfully CREATED REQUEST", requestQuoteId);

      // console.log("result:", result,member.email);

      // Send success response
      res.status(200).json({
        status: 1,
        apple_obj: apple_obj,
        order_id: requestQuoteId,
        token_arr: token_arr, // ✅ Add this line
        msg:
          payment_method === "apple-pay"
            ? "Request Quote created, now you'll be redirected to apple pay for transaction!"
            : "Your order has been successfully created!",
        data: {
          requestId: helpers.doEncode(requestQuoteId),
        },
      });

    } catch (error) {
      console.error("Error in createRequestQuote:", error);
      res.status(200).json({
        error: "Internal server error",
        details: error.message,
        // stack: error.stack, // 👈 include stack trace temporarily
      });
    }
  }

  async getMemberFromToken(req, res) {
    try {
      const { token, memType } = req.body;
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // Call the method from BaseController to get user data
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const userId = userResponse?.user?.id; // Assuming user ID is in `userResponse.user.id`

      if (!userId) {
        return res.status(200).json({ status: 0, msg: "User ID not found." });
      }

      // Fetch unread notifications count using the model
      const unreadCount = await this.member.getUnreadNotificationsCount(
        userId,
        memType
      );

      const attachments = await this.rider.getRiderAttachments(userId);

      const selfPicture = attachments.find(
        (item) => item.type === "self_picture"
      );
      // console.log("attachments:", attachments);

      const latestNotifications = await this.member.getLatestNotifications();
      // console.log("latestNotifications:",latestNotifications)

      const memberData = {
        ...userResponse?.user, // Spread existing user data
        latest_notifications: latestNotifications,
        self_picture: selfPicture,
      };
      // console.log("memberData:",memberData)
      const siteSettings = res.locals.adminData;
      // console.log("siteSettings:",siteSettings)

      return res.status(200).json({
        status: 1,
        member: memberData,
        site_settings: siteSettings,
        notifications_count: unreadCount,
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
      if (
        !req.files ||
        !req.files["mem_image"] ||
        req.files["mem_image"].length === 0
      ) {
        return res.status(200).json({ status: 0, msg: "No file uploaded." });
      }

      // Get the uploaded file and construct the file path
      const memImage = req.files["mem_image"][0].filename;
      // console.log("Extracted Filename:", memImage);

      const imageUrl = `${memImage}`; // Adjust the path based on your frontend setup
      // console.log("imageUrl:", imageUrl);

      // const imageUrl = `${memImage}`; // Customize the path based on your application structure if needed

      // Update the profile image in the database based on memType
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(member.id, {
          mem_image: imageUrl,
        });
      } else if (memType === "rider") {
        await this.rider.updateRiderData(member.id, {
          mem_image: imageUrl,
        });
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid memType provided." });
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

  updateUserPhoneNumber = async (req, res) => {
    try {
      const { token, mem_phone, memType } = req.body;
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
      if (!mem_phone) {
        return res.status(200).json({
          status: 0,
          msg: "Phone required.",
        });
      }
      let existingPhone = await this.member.findByPhone(mem_phone);

      // Check if the rider exists by email
      if (existingPhone) {
        return res
          .status(200)
          .json({ status: 0, msg: "Phone already exists." });
      }
      let updatedData = {
        mem_phone,
      };
      const newExpireTime = new Date();
      newExpireTime.setMinutes(newExpireTime.getMinutes() + 3);
      let otp = Math.floor(100000 + Math.random() * 900000);
      updatedData.phone_otp = parseInt(otp, 10); // Add OTP to cleanedData
      updatedData.phone_expire_time = newExpireTime;
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(userId, updatedData); // Update member data
      }
      return res.status(200).json({
        status: 1,
        msg: "Phone updated successfully.",
        expire_time: updatedData.phone_expire_time,
        mem_phone: mem_phone,
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
  resendOtpUserPhoneNumber = async (req, res) => {
    try {
      const { token, mem_phone, memType } = req.body;
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

      let updatedData = {};
      const newExpireTime = new Date();
      newExpireTime.setMinutes(newExpireTime.getMinutes() + 3);
      let otp = Math.floor(100000 + Math.random() * 900000);
      updatedData.phone_otp = parseInt(otp, 10); // Add OTP to cleanedData
      updatedData.phone_expire_time = newExpireTime;
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(userId, updatedData); // Update member data
      }
      return res.status(200).json({
        status: 1,
        msg: "Code sent successfully.",
        expire_time: updatedData.phone_expire_time,
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

  cancelJobRequest = async (req, res) => {
    try {
      const { token, order_id, reason } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // // Validate user token
      // const userResponse = await this.validateTokenAndGetMember(token, "user");
      // if (userResponse.status === 0) {
      //   return res.status(200).json(userResponse);
      // }

      // NEW (checks both "user" and "business" types):
      let member = null;
      let memberType = null;

      const userResponse = await this.validateTokenAndGetMember(token, "user");
      if (userResponse.status === 1) {
        member = userResponse.user;
        memberType = "user";
      } else {
        const businessResponse = await this.validateTokenAndGetMember(token, "business");
        if (businessResponse.status === 1) {
          member = businessResponse.user;
          memberType = "business";
        } else {
          return res.status(200).json({
            status: 0,
            msg: "Invalid token or unauthorized access.",
            not_logged_in: 1
          });
        }
      }

      // const member = userResponse.user;

      if (!order_id) {
        return res.status(200).json({ status: 0, msg: "Order ID is required." });
      }

      // FETCH ORDER MAIN DETAILS
      let order = await this.member.getOrderDetailsByIdforcancelRequest({
        requestId: order_id
      });

      if (!order) {
        return res.status(200).json({ status: 0, msg: "Invalid order!" });
      }

      // ---------- FETCH RELATED ORDER DETAILS ----------
      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      const reviews = await this.rider.getOrderReviews(order.id);
      const order_stages_arr = await this.rider.getRequestOrderStages(order.id);

      order = {
        ...order,
        formatted_start_date: helpers.formatDateToUK(order?.start_date),
        parcels,
        vias,
        invoices,
        viasCount,
        reviews,
        order_stages: order_stages_arr,
      };

      // ---------- CHECK IF ALREADY CANCELLED ----------
      if (order.is_cancelled === "requested") {
        return res.status(200).json({
          status: 0,
          msg: "A cancel request has already been submitted for this order.",
        });
      }

      if (order.is_cancelled === "approved") {
        return res.status(200).json({
          status: 0,
          msg: "This order has already been cancelled.",
        });
      }

      // ===============================
      // 🟢 FETCH RIDER DETAILS (if assigned)
      // ===============================
      let riderData = null;
      if (order.assigned_rider) {
        riderData = await this.rider.findById(order.assigned_rider);
      }

      // ===============================
      // 🟢 FETCH VEHICLE CANCELLATION AMOUNT
      // ===============================
      let vehicleCancellationAmount = 0;
      if (order.selected_vehicle) {
        const vehicleData = await this.rider.getVehicleById(order.selected_vehicle);
        if (vehicleData && vehicleData.cancellation_charges) {
          vehicleCancellationAmount = parseFloat(vehicleData.cancellation_charges) || 0;
          console.log(`Vehicle cancellation amount: £${vehicleCancellationAmount}`);
        }
      }

      // ===============================
      // 🟢 CHECK IF RIDER HAS ARRIVED
      // ===============================
      const orderStages = await this.rider.getRequestOrderStages(order_id);
      const hasArrived = orderStages?.some(stage =>
        stage.status === "arrived" ||
        stage.stage_name === "arrived" ||
        stage.stage_status === "arrived"
      );

      console.log(`Order Stages Check - Has Arrived: ${hasArrived}`);

      // ===============================
      // 🟢 REFUND / CANCELLATION LOGIC
      // ===============================
      const isRiderAssigned = !!order.assigned_rider;
      let isWithin10Minutes = false;
      let cancellationChargePercent = 0;
      let cancellationReason = "";

      // Case 1: Rider has arrived → 100% cancellation charge (no refund)
      if (hasArrived) {
        cancellationChargePercent = 100;
        cancellationReason = "Rider has arrived on site";
        console.log("Rider has arrived on site - 100% cancellation charge applies");
      }
      // Case 2: Rider assigned but not arrived yet
      else if (isRiderAssigned && order.assigned_date) {
        const now = new Date();
        const assignedDate = new Date(order.assigned_date);
        const diffMinutes = (now - assignedDate) / (1000 * 60);
        isWithin10Minutes = diffMinutes <= 10;

        console.log(`Rider assigned at: ${assignedDate}, Time elapsed: ${diffMinutes.toFixed(2)} minutes`);

        // After 10 mins → 50% cancellation charges
        if (!isWithin10Minutes) {
          cancellationChargePercent = 50;
          cancellationReason = `Cancellation after ${Math.floor(diffMinutes)} minutes of rider acceptance`;
        } else {
          cancellationReason = `Cancellation within ${Math.floor(diffMinutes)} minutes of rider acceptance`;
        }
      } else {
        cancellationReason = "No rider assigned yet";
      }

      console.log(`Cancel Request - Order: ${order_id}, Rider Assigned: ${isRiderAssigned}, Has Arrived: ${hasArrived}, Within10Min: ${isWithin10Minutes}, CancellationCharge: ${cancellationChargePercent}%`);

      // ===============================
      // 🟢 AUTO APPROVE CANCELLATION
      // ===============================
      await this.member.updateRequestQuoteData(order_id, {
        is_cancelled: "approved",
        cancel_reason: reason,
        cancelled_at: helpers.getUtcTimeInSeconds(),
      });

      const originalAmount = parseFloat(order.total_amount) || 0;
      let refundAmount = originalAmount;

      // Apply cancellation charges
      if (cancellationChargePercent === 100) {
        refundAmount = 0; // No refund
      } else if (cancellationChargePercent === 50) {
        refundAmount = originalAmount * 0.5; // 50% refund
      }
      // else: Full refund (100%)

      let refundProcessed = false;
      let responseMessage = "";

      // ===============================
      // 🟢 ADD REFUND INTO USER CREDITS
      // ===============================
      if (refundAmount > 0) {
        try {
          // Fetch user details to get mem_type
          const user = await this.member.findById(order.user_id);

          if (!user) {
            throw new Error("User not found");
          }

          // Insert credit record with correct type based on mem_type
          await this.member.insertUserCredits({
            user_id: order.user_id,
            credits: refundAmount,
            mem_type: user.mem_type, // Pass mem_type to determine credit type
          });

          // Update member total credits
          await this.member.updateMemberData(order.user_id, {
            total_credits:
              parseFloat(user?.total_credits || 0) +
              parseFloat(refundAmount || 0),
          });

          refundProcessed = true;

          const creditType = user.mem_type === "business" ? "user" : "simple_user";
          console.log(`✅ Refund credits added successfully: £${refundAmount} (User Type: ${user.mem_type}, Credit Type: ${creditType})`);
        } catch (err) {
          console.error("❌ Credit refund error:", err.message);
        }
      }

      // ===============================
      // 🟢 PAY RIDER CANCELLATION AMOUNT
      // ===============================
      let riderCancellationPaid = false;
      let riderCancellationAmount = 0;

      // Only pay rider if 50% or 100% cancellation charges apply
      if ((cancellationChargePercent === 50 || cancellationChargePercent === 100) &&
        isRiderAssigned &&
        vehicleCancellationAmount > 0) {

        riderCancellationAmount = vehicleCancellationAmount;

        try {
          // Store earnings for rider cancellation payment
          await helpers.insertEarnings({
            user_id: order.assigned_rider,
            amount: riderCancellationAmount,
            type: "cancellation_fee",
            status: "pending",
            created_time: helpers.getUtcTimeInSeconds(),
            order_id: order.id,
            description: `Cancellation fee for order ${order.booking_id} (${cancellationChargePercent}% charge)`,
          });


          riderCancellationPaid = true;
          console.log(`✅ Rider cancellation amount paid: £${riderCancellationAmount}`);
        } catch (err) {
          console.error("❌ Rider cancellation payment error:", err.message);
        }
      }

      // ADD THIS: Round to 2 decimal places to avoid floating point issues
      const roundedOriginalAmount = Math.round(originalAmount * 100) / 100;
      const roundedRefundAmount = Math.round(refundAmount * 100) / 100;
      const roundedRiderCancellationAmount = Math.round(riderCancellationAmount * 100) / 100;

      // ===============================
      // 🟢 BUILD RESPONSE MESSAGE
      // ===============================
      if (cancellationChargePercent === 100) {
        // Case 1: Rider has arrived (100% charge, no refund)
        responseMessage = `Order cancelled successfully. 100% cancellation charges apply as the rider has already arrived on site. No refund will be processed.`;
      } else if (!isRiderAssigned) {
        // Case 2: No rider assigned (full refund)
        responseMessage = refundProcessed
          ? `Order cancelled successfully. Full refund of £${roundedRefundAmount.toFixed(2)} has been processed.`
          : "Order cancelled successfully. Full refund will be processed shortly.";
      } else if (isWithin10Minutes) {
        // Case 3: Rider assigned but within 10 minutes (full refund)
        responseMessage = refundProcessed
          ? `Order cancelled successfully. Full refund of £${roundedRefundAmount.toFixed(2)} has been processed.`
          : "Order cancelled successfully. Full refund will be processed shortly.";
      } else {
        // Case 4: Rider assigned and after 10 minutes (50% charge)
        responseMessage = refundProcessed
          ? `Order cancelled successfully. 50% cancellation charges applied. Refund of £${roundedRefundAmount.toFixed(2)} (50% of £${roundedOriginalAmount.toFixed(2)}) has been processed.`
          : `Order cancelled successfully. 50% cancellation charges applied. Refund of £${roundedRefundAmount.toFixed(2)} (50% of £${roundedOriginalAmount.toFixed(2)}) will be processed shortly.`;
      }

      // ===============================
      // 🟢 SEND EMAIL NOTIFICATIONS
      // ===============================
      const adminData = res.locals.adminData;

      // 1️⃣ Send email to USER
      try {
        await helpers.sendEmail(
          member.email,
          "Order Cancelled - FastUK",
          "order-cancelled-user",
          {
            adminData,
            order,
            member,
            reason,
            refundAmount: roundedRefundAmount,
            originalAmount: roundedOriginalAmount,
            refundProcessed,
            cancellationChargePercent,
            hasArrived,
            cancellationReason,
          }
        );
      } catch (emailErr) {
        console.error("User email send error:", emailErr.message);
      }

      // 2️⃣ Send email to RIDER (if cancellation amount paid)
      if (riderCancellationPaid && riderData) {
        try {
          await helpers.sendEmail(
            riderData.email,
            "Cancellation Fee Received - FastUK",
            "rider-cancellation-fee",
            {
              adminData,
              order,
              rider: riderData,
              reason,
              cancellationAmount: roundedRiderCancellationAmount,
              cancellationChargePercent,
              hasArrived,
            }
          );
        } catch (emailErr) {
          console.error("Rider email send error:", emailErr.message);
        }
      }

      // 3️⃣ Send email to ADMIN
      try {
        const adminEmailData = {
          adminData,
          order,
          user: member,
          rider: riderData,
          reason,
          originalAmount: roundedOriginalAmount,
          refundAmount: roundedRefundAmount,
          cancellationChargePercent,
          refundProcessed,
          hasArrived,
          cancellationReason,
          isRiderAssigned,
          riderCancellationAmount: roundedRiderCancellationAmount,
          riderCancellationPaid,
        };

        await helpers.sendEmail(
          adminData.receiving_site_email,
          "Order Cancellation Alert - FastUK",
          "order-cancelled-admin",
          adminEmailData
        );
      } catch (emailErr) {
        console.error("Admin email send error:", emailErr.message);
      }

      // ===============================
      // 🟢 FINAL RESPONSE (ONLY ONE RETURN)
      // ===============================
      return res.status(200).json({
        status: 1,
        msg: responseMessage,
        refund_amount: roundedRefundAmount,
        original_amount: roundedOriginalAmount,
        cancellation_charge_percent: cancellationChargePercent,
        refund_processed: refundProcessed,
        has_arrived: hasArrived,
        rider_cancellation_amount: roundedRiderCancellationAmount,
        rider_cancellation_paid: riderCancellationPaid,
      });

    } catch (error) {
      console.error("Error cancelling job request:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message,
      });
    }
  };





  updateProfile = async (req, res) => {
    try {
      const {
        token,
        first_name,
        last_name,
        mem_phone,
        address,
        bio,
        national_insurance_num,
        memType,
        vehicle_owner,
        vehicle_type,
        vehicle_id,
        vat_registered,
        vat_number,
        vat_registration_certificate,
        vehicle_insurance,
        good_transit_insurance,
        city,
        vehicle_registration_num,
        driving_license_num,
        utr_num,
        dob,
        designation,
        business_name,
        business_type,
        parcel_type,
        parcel_weight,
        vat_num,

        shipment_volume,
        delivery_speed,
      } = req.body; // Assuming token and user data are sent in the request body
      console.log(req.body.vehicle_id, "vehicle_id")
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
      let existingPhone = await this.member.findByPhoneNumber(mem_phone);

      if (existingPhone && Number(existingPhone.id) !== Number(userId)) {
        return res.status(200).json({
          status: 0,
          msg: "Phone Number already exists."
        });
      }
      // Save the updated member data
      let updatedData = {
        full_name: first_name + " " + last_name,
        mem_phone,
        mem_address1: address,
        mem_bio: bio || "", // If bio is provided, use it; otherwise, set it to an empty string
      };

      // Check memType and update accordingly
      if (memType === "user" || memType === "business") {
        if (memType === "business") {
          updatedData = {
            ...updatedData,
            mem_city: city,
            designation: designation,

            business_name: business_name,
            business_type: business_type,
            parcel_type: parcel_type,
            parcel_weight: parcel_weight,
            shipment_volume: shipment_volume,
            delivery_speed: delivery_speed,
            vat_num: vat_num,
          };
        }
        await this.member.updateMemberData(userId, updatedData); // Update member data
      } else if (memType === "rider") {
        updatedData.vehicle_owner = vehicle_owner;
        updatedData.vehicle_type = vehicle_type;
        updatedData.city = city;
        updatedData.vehicle_registration_num = vehicle_registration_num;
        updatedData.driving_license_num = driving_license_num;
        updatedData.dob = dob;
        updatedData.national_insurance_num = national_insurance_num;
        updatedData.utr_num = utr_num;
        updatedData.vehicle_id = vehicle_id || null;
        updatedData.vat_registered = vat_registered;
        updatedData.vat_number = vat_number;
        await this.rider.updateRiderData(userId, updatedData); // Update rider data
        console.log("Rider data updated:", updatedData);
        // 🔽 NEW: Handle attachments
        let { documents } = req.body;
        let attachments_ob =
          documents !== null &&
            documents !== undefined &&
            documents !== "" &&
            documents !== "null"
            ? JSON.parse(documents)
            : {};
        const attachments = [];

        // if (attachments_ob?.driving_license) {
        //   attachments.push({
        //     rider_id: userId,
        //     filename: attachments_ob?.driving_license,
        //     type: "driving_license",
        //   });
        // }
        if (Array.isArray(attachments_ob.driving_license)) {
          attachments_ob.driving_license.forEach((pic) => {
            attachments.push({
              rider_id: userId,
              filename: pic,
              type: "driving_license",
            });
          });
        }
        if (attachments_ob?.vat_registration_certificate) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.vat_registration_certificate,
            type: "vat_registration_certificate",
          });
        }
        if (attachments_ob?.good_transit_insurance) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.good_transit_insurance,
            type: "good_transit_insurance",
          });
        }
        if (attachments_ob?.vehicle_insurance) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.vehicle_insurance,
            type: "vehicle_insurance",
          });
        }
        if (attachments_ob?.insurance_certificate) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.insurance_certificate,
            type: "insurance_certificate",
          });
        }
        if (attachments_ob?.address_proof) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.address_proof,
            type: "address_proof",
          });
        }
        if (attachments_ob?.self_picture) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.self_picture,
            type: "self_picture",
          });
        }
        if (attachments_ob?.passport_pic) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.passport_pic,
            type: "passport_pic",
          });
        }
        // if (attachments_ob?.national_insurance) {
        //   attachments.push({
        //     rider_id: userId,
        //     filename: attachments_ob?.national_insurance,
        //     type: "national_insurance",
        //   });
        // }
        if (attachments_ob?.company_certificate) {
          attachments.push({
            rider_id: userId,
            filename: attachments_ob?.company_certificate,
            type: "company_certificate",
          });
        }
        if (Array.isArray(attachments_ob.pictures)) {
          attachments_ob.pictures.forEach((pic) => {
            attachments.push({
              rider_id: userId,
              filename: pic,
              type: "pictures",
            });
          });
        }
        if (Array.isArray(attachments_ob.other_documents)) {
          attachments_ob.other_documents.forEach((doc) => {
            attachments.push({
              rider_id: userId,
              filename: doc,
              type: "other_documents",
            });
          });
        }
        // console.log(attachments);return;
        if (Array.isArray(attachments) && attachments.length > 0) {
          // Optional: Delete old attachments
          await this.rider.deleteAttachments(userId);

          // Insert new attachments
          for (const file of attachments) {
            if (file.filename && file.type) {
              await this.rider.insertAttachment(
                userId,
                file.filename,
                file.type
              );
            }
          }
        }
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

      if (memType === "user" || memType === "business") {
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
  getDashboardUserOrders = async (req, res) => {
    try {
      const { token, memType } = req.body;
      // console.log(req.body)

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
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
        status: "in_progress",
        limit: 3,
      });
      // console.log("memberOrders:", memberOrders);

      const memberCurrentOrders = await this.member.getOrdersByUserAndStatus({
        userId: member.id,
        status: "not_completed", // <-- will fetch all orders whose status != completed

      });
      const memberTotalOrders = await this.member.getOrdersByUserAndStatus({
        userId: member.id,
      });
      const userInvoices = await this.member.getUserInvoices(member.id);
      const memberTotalAcceptedOrders =
        await this.member.getOrdersByUserAndStatus({
          userId: member.id,
          status: "accepted",
        });

      // Encode the `id` for each order
      // const ordersWithEncodedIds = memberOrders.map((order) => {
      //   const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
      //   return { ...order, encodedId }; // Add encodedId to each order
      // });

      const ordersWithEncodedIds = await Promise.all(
        memberOrders.map(async (order) => {

          const encodedId = helpers.doEncode(String(order.id));

          const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);
          const formatted_end_date = order?.end_date
            ? helpers.formatDateTimeToUK(order.end_date)
            : "Will be available after rider accepts the order";

          return {
            ...order,
            formatted_start_date: helpers.formatDateToUK(order?.start_date),
            formatted_end_date: formatted_end_date,
            encodedId,
            jobStatus
          };
        })
      );

      // console.log("Member Orders with Encoded IDs:", ordersWithEncodedIds);

      // Return the fetched orders with encoded IDs
      return res.status(200).json({
        status: 1,
        msg: "Orders fetched successfully.",
        orders: ordersWithEncodedIds,
        memberCurrentOrders: memberCurrentOrders?.length,
        // total_active_orders: memberTotalAcceptedOrders?.length,
        total_orders: memberTotalOrders?.length,
        total_invoices: userInvoices?.length,
      });
    } catch (error) {
      console.error("Error in getRiderOrders:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message,
      });
    }
  };
  getUserOrders = async (req, res) => {
    try {
      const { token, memType, status, search } = req.body;
      // console.log(req.body)

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
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
        status: status,
        search: search,
      });
      // console.log("status:", status);
      // console.log("memberOrders:", memberOrders);

      // console.log("User Orders before encoding:", memberOrders);

      // Encode the `id` for each order
      // const ordersWithEncodedIds = memberOrders.map((order) => {
      //   const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
      //   return { ...order, encodedId }; // Add encodedId to each order
      // });

      const ordersWithEncodedIds = [];

      for (const order of memberOrders) {
        const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);
        const encodedId = helpers.doEncode(String(order.id));
        const formatted_end_date = order?.end_date
          ? helpers.formatDateTimeToUK(order.end_date)
          : "Will be available after rider accepts the order";

        ordersWithEncodedIds.push({
          ...order,
          formatted_start_date: helpers.formatDateToUK(order?.start_date),
          formatted_end_date: formatted_end_date,
          encodedId,
          jobStatus,
        });
      }

      // console.log("Member Orders with Encoded IDs:", ordersWithEncodedIds);

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
  };

  async getUserTransactions(req, res) {
    try {
      const { token, memType } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
        return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }

      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const member = userResponse.user;
      const userId = member.id;

      const remotePostCodes = await RemotePostCodeModel.getRemotePostCodesInArray();
      const siteSettings = res.locals.adminData;

      const normalize = (v) =>
        String(v || "").replace(/\s+/g, "").toLowerCase();

      const getRemotePrice = (postcode) => {
        const matches = remotePostCodes.filter(
          (r) => normalize(r.title) === normalize(postcode)
        );

        if (matches.length === 0) return 0;

        const highest = matches.reduce((max, curr) =>
          Number(curr.remote_price) > Number(max.remote_price) ? curr : max
        );

        return Number(highest.remote_price || 0);
      };



      const transactions = await helpers.getTransaction(userId);
      // console.log("Transactions:", transactions);


      const enrichedTransactions = await Promise.all(
        transactions.map(async (t) => {

          const job = Number(t.total_amount || 0);
          const handball = Number(t.total_handball_charges || 0);
          const waiting = Number(t.total_waiting_charges || 0);

          const subtotal = job + handball + waiting;

          const request_id = t.request_id;
          const vehicle = t.selected_vehicle
            ? await Vehicle.getSelectedVehicleById(t.selected_vehicle)
            : null;

          if (!vehicle) {
            console.warn("Vehicle not found for transaction:", t.id);
            return t;
          }

          const vias = await this.rider.countViasBySourceCompleted(request_id);
          const parcels = await this.rider.getParcelDetailsByQuoteId(request_id);
          const stages = await this.rider.getRequestOrderStages(request_id);
          const invoices = await this.rider.getInvoicesDetailsByRequestId(request_id);
          const reviews = await this.rider.getOrderReviews(request_id);
          const riderRow = await this.rider.findById(t.assigned_rider);
          const jobStatus = await helpers.updateRequestQuoteJobStatus(request_id);

          const handballChargesNumeric = stages.reduce((sum, stage) => {
            return sum + (Number(stage.handball_charges) || 0);
          }, 0);
          const waitingChargesNumeric = stages.reduce((sum, stage) => {
            return sum + (Number(stage.waiting_charges) || 0);
          }, 0);

          const remote_price =
            getRemotePrice(t.source_postcode) +
            getRemotePrice(t.dest_postcode);

          const orderAmount = await helpers.calculateOrderTotal(
            Number(t.distance || 0),
            siteSettings,
            vehicle.price,
            remote_price,
            vehicle.id,
            t.handball_work,
            handballChargesNumeric,
            waitingChargesNumeric
          );

          return {
            ...t,
            // subtotal: helpers.formatAmount(subtotal),
            // grandTotal: helpers.formatAmount(subtotal),
            // jobStatus,

            // ✅ Use helper values
            total_distance: orderAmount.totalDistance,
            sub_total: helpers.formatAmount(orderAmount.totalAmount),
            tax: helpers.formatAmount(orderAmount.taxAmount),
            vat: helpers.formatAmount(orderAmount.vatAmount),
            handball_charges: helpers.formatAmount(orderAmount.handballChargesNumeric),
            waiting_charges: helpers.formatAmount(orderAmount.waitingChargesNumeric),

            remote_price: helpers.formatAmount(orderAmount.remote_price),

            grandTotal: helpers.formatAmount(orderAmount.grandTotal),


            formatted_start_date: helpers.formatDateToUK(t.job_start_date),
            formatted_end_date: t.job_end_date
              ? helpers.formatDateTimeToUK(t.job_end_date)
              : "Pending",

            vias,
            parcels,
            order_stages: stages,
            invoices,
            reviews,
            riderRow
          };
        })
      );
      // ✅ PLACE IT HERE
      if (!enrichedTransactions || enrichedTransactions.length === 0) {
        return res.status(200).json({
          status: 1,
          transactions: []
        });
      }
      const jobStatus = await helpers.updateRequestQuoteJobStatus(enrichedTransactions[0].request_id);

      // Category info
      // const categoryInfo = order.selected_vehicle
      //   ? await Vehicle.getCategoryAndMainCategoryById(summary.selected_vehicle)
      //   : null;

      // Vias, parcels, stages, attachments, invoices, reviews, payments
      const viasCount = await this.rider.countViasBySourceCompleted(enrichedTransactions[0].request_id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(enrichedTransactions[0].request_id);
      const order_stages_arr = await this.rider.getRequestOrderStages(enrichedTransactions[0].request_id);
      const vias = await this.rider.getViasByQuoteId(enrichedTransactions[0].request_id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(enrichedTransactions[0].request_id);
      const reviews = await this.rider.getOrderReviews(enrichedTransactions[0].request_id);
      const paidAmount = await RequestQuoteModel.totalPaidAmount(enrichedTransactions[0].request_id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(enrichedTransactions[0].request_id);
      const riderRow = await this.rider.findById(
        enrichedTransactions[0].assigned_rider
      );




      const job = Number(enrichedTransactions[0].total_amount || 0);
      const handball = Number(enrichedTransactions[0].total_handball_charges || 0);
      const waiting = Number(enrichedTransactions[0].total_waiting_charges || 0);

      const formatted_start_date = helpers.formatDateToUK(enrichedTransactions[0]?.job_start_date) || "N/A";
      const formatted_end_date = enrichedTransactions[0]?.job_end_date
        ? helpers.formatDateTimeToUK(enrichedTransactions[0].job_end_date)
        : "Will be available after rider accepts the order";


      const subtotal = job + handball + waiting;
      const grandTotal = subtotal;
      // console.log("enrichedTransactions[0]:", enrichedTransactions[0])
      // summary.category_name = categoryInfo?.category_name || null;
      // summary.main_category_name = categoryInfo?.main_category_name || null; 

      return res.status(200).json({
        status: 1,
        transactions: enrichedTransactions
      });

    } catch (error) {
      console.error("Error fetching member transactions:", error);
      return res.status(500).json({ status: 0, msg: "Internal Server Error" });
    }
  }
  async getUserTransactionsprevious(req, res) {
    try {
      const { token, memType } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
        return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }

      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const member = userResponse.user;
      const userId = member.id;

      // Fetch all transactions
      const transactions = await helpers.getTransaction(userId);
      const updatedTransactions = [];

      for (const t of transactions) {
        // Fetch order details
        const order = await this.member.getUserOrderDetailsById({
          userId,
          requestId: t.transaction_id,
        });


        if (order) {
          // Attach formatted dates
          t.formatted_start_date = helpers.formatDateToUK(order.start_date);
          // t.formatted_end_date = helpers.formatDateTimeToUK(order.end_date);
          t.formatted_end_date = order.end_date
            ? helpers.formatDateTimeToUK(order.end_date)
            : "Will be available after rider accepts the order";


          // Job status
          const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);

          // Category info
          const categoryInfo = order.selected_vehicle
            ? await Vehicle.getCategoryAndMainCategoryById(order.selected_vehicle)
            : null;

          // Vias, parcels, stages, attachments, invoices, reviews, payments
          const viasCount = await this.rider.countViasBySourceCompleted(order.id);
          const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
          const order_stages_arr = await this.rider.getRequestOrderStages(order.id);
          const vias = await this.rider.getViasByQuoteId(order.id);
          const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
          const reviews = await this.rider.getOrderReviews(order.id);
          const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
          const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);
          const riderRow = await this.rider.findById(
            order.assigned_rider
          );

          // Attach stage attachments
          for (let stage of order_stages_arr) {
            stage.attachments = await helpers.getDataFromDB("order_stages_attachments", { stage_id: stage.id });
          }

          // Attach source & destination attachments
          const source_attachments = await helpers.getDataFromDB("request_quote_attachments", { request_id: order.id, type: "source" });
          const destination_attachments = await helpers.getDataFromDB("request_quote_attachments", { request_id: order.id, type: "destination" });

          // Attach via attachments
          for (let via of vias) {
            via.attachments = await helpers.getDataFromDB("request_quote_attachments", {
              request_id: order.id,
              type: "via",
              via_id: via.id,
            });
          }

          const siteSettings = res.locals.adminData;
          // console.log("siteSettings:",siteSettings)

          // Merge order info
          t.order = {
            ...order,
            siteSettings,
            formatted_start_date: helpers.formatDateToUK(order.start_date),
            formatted_end_date: order.end_date
              ? helpers.formatDateTimeToUK(order.end_date)
              : "Will be available after rider accepts the order",
            parcels,
            order_stages: order_stages_arr,
            vias,
            riderRow,
            invoices,
            dueAmount: helpers.formatAmount(dueAmount),
            paidAmount: helpers.formatAmount(paidAmount),
            viasCount,
            reviews,
            source_attachments,
            destination_attachments,
            category_name: categoryInfo?.category_name || null,
            main_category_name: categoryInfo?.main_category_name || null,
            jobStatus,
          };
        } else {
          t.formatted_start_date = null;
          t.formatted_end_date = null;
          t.order = null;
        }

        updatedTransactions.push(t);
      }
      // console.log("updatedTransactions:",updatedTransactions)

      return res.status(200).json({
        status: 1,
        transactions: updatedTransactions,
      });

    } catch (error) {
      console.error("Error fetching member transactions:", error);
      return res.status(500).json({ status: 0, msg: "Internal Server Error" });
    }
  }


  async getUserOrderDetailsByEncodedId(req, res) {
    try {
      const { token, memType } = req.body;
      // console.log(token)
      const { encodedId } = req.params;

      let paymentMethods = [];

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (!encodedId) {
        return res
          .status(200)
          .json({ status: 0, msg: "Encoded ID is required." });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }

      const member = userResponse.user;

      // Decode the encoded ID
      const decodedId = helpers.doDecode(encodedId);
      // console.log("Decoded ID:", decodedId); // Add this line to log the decoded ID

      // Fetch the order using the decoded ID and check if the rider_id matches the logged-in rider's ID
      let order = await this.member.getUserOrderDetailsById({
        userId: member.id,
        requestId: decodedId,
      });

      // console.log("Order from DB:", order); // Add this line to log the order fetched from the database

      if (!order) {
        return res.status(200).json({ status: 0, msg: "Order not found." });
      }

      const riderRow = await this.rider.findById(order.assigned_rider);
      const attachments = await this.rider.getRiderAttachments(riderRow?.id); // Add this method in your model
      const pendingPayment = await this.rider.getPendingPaymentByRequestId(order.id); // Add this method in your model
      const qrCode = attachments.find(att => att.type === 'qr_code');
      // Organize attachments by type for easier access in EJS

      // Check if the assigned rider matches the logged-in rider
      if (order.user_id !== member.id) {
        return res
          .status(200)
          .json({ status: 0, msg: "This order does not belong to the user." });
      }

      const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);
      // console.log("jobStatus on member:",jobStatus)
      // console.log("order.id:",order.id)

      const categoryInfo = order.selected_vehicle
        ? await Vehicle.getCategoryAndMainCategoryById(order.selected_vehicle)
        : null;

      // console.log("categoryInfo:", categoryInfo)

      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
      // console.log("parcels:", parcels);
      const order_stages_arr = await this.rider.getRequestOrderStages(order.id);
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      const reviews = await this.rider.getOrderReviews(order.id);
      // Calculate the due amount by summing the amount where status is 0
      // const dueAmount = await this.requestQuote.calculateDueAmount(order.id);
      // Calculate the paid amount and due amount
      const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);
      // console.log("invoices:", invoices); // Add this line to log the decoded ID

      const formattedPaidAmount = helpers.formatAmount(paidAmount);
      const formattedDueAmount = helpers.formatAmount(dueAmount);
      // console.log("vias:", vias); // Add this line to log the decoded ID


      // Fetch attachments for each stage
      for (let stage of order_stages_arr) {
        const stage_attachments = await helpers.getDataFromDB(
          "order_stages_attachments",
          { stage_id: stage.id } // stage.id exists here
        );

        // Attach to stage object if needed
        stage.attachments = stage_attachments;
      }

      const source_attachments = await helpers.getDataFromDB(
        "request_quote_attachments",
        { request_id: order.id, type: "source" }
      );
      const destination_attachments = await helpers.getDataFromDB(
        "request_quote_attachments",
        { request_id: order.id, type: "destination" }
      );
      for (let via of vias) {
        const via_attachments = await helpers.getDataFromDB(
          "request_quote_attachments",
          {
            request_id: order.id,
            type: "via",
            via_id: via?.id,
          }
        );

        via.attachments = via_attachments; // Add attachments array to each via
      }
      // console.log("end",order?.end_date, helpers.formatDateTimeToUK(order?.end_date))

      const riderNotes = await this.rider.getRiderNotes(
        order?.assigned_rider,
        decodedId
      );

      const formatted_end_date = order?.end_date
        ? helpers.formatDateTimeToUK(order.end_date)
        : "Will be available after rider accepts the order";

      order = {
        ...order,
        formatted_start_date: helpers.formatDateToUK(order?.start_date),
        // formatted_end_date: helpers.formatDateTimeToUK(order?.end_date),
        formatted_end_date: formatted_end_date,
        qrCode,
        pendingPayment,

        encodedId: encodedId,
        parcels: parcels,
        order_stages: order_stages_arr,
        vias: vias,
        riderNotes: riderNotes,
        invoices: invoices,
        dueAmount: formattedDueAmount,
        paidAmount: formattedPaidAmount,
        viasCount: viasCount,
        reviews: reviews,
        source_attachments: source_attachments,
        destination_attachments: destination_attachments,
        category_name: categoryInfo?.category_name || null,
        main_category_name: categoryInfo?.main_category_name || null,
        jobStatus: jobStatus
      };
      // Fetch parcels and vias based on the quoteId from the order
      // Assuming order.quote_id is the relevant field
      // console.log("formatted_end_date:",helpers.formatDateTimeToUK(order?.end_date))

      // Fetch payment methods for the user
      const fetchedPaymentMethods =
        await this.paymentMethodModel.getPaymentMethodsByUserId(
          member.id,
          memType
        );
      // console.log(fetchedPaymentMethods)

      if (fetchedPaymentMethods && fetchedPaymentMethods.length > 0) {
        paymentMethods = fetchedPaymentMethods.map((method) => ({
          encoded_id: helpers.doEncode(method.id),
          card_number: helpers.doDecode(method.card_number),
        }));
      }

      const siteSettings = res.locals.adminData;



      // Return the order details along with parcels and vias
      return res.status(200).json({
        status: 1,
        msg: "Order details fetched successfully.",
        order, // Add vias to the response
        siteSettings,
        paymentMethods,
      });
    } catch (error) {
      console.error("Error in :", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message,
      });
    }
  }
  async getUserOrderDetailsByTrackingId(req, res) {
    try {
      const { token, memType } = req.body;
      // console.log(token)
      const { tracking_id } = req.params;
      // console.log("tracking_id:", tracking_id);

      let paymentMethods = [];
      if (!tracking_id) {
        return res
          .status(200)
          .json({ status: 0, msg: "Tracking ID is required." });
      }

      // console.log("Decoded ID:", decodedId); // Add this line to log the decoded ID

      // Fetch the order using the decoded ID and check if the rider_id matches the logged-in rider's ID
      let order = await this.member.getUserOrderDetailsByTrackingId({
        tracking_id: tracking_id,
      });

      // console.log("Order from DB:", order); // Add this line to log the order fetched from the database

      if (!order) {
        return res.status(200).json({ status: 0, msg: "Order not found." });
      }

      const attachments = await adminRider.getRiderAttachments(order?.assigned_rider); // Add this method in your model
      const qrCodeAttachment = attachments.find(
        att => att.type === 'qr_code'
      );

      // console.log("QR Code attachment:", qrCodeAttachment);

      const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);

      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id); // Assuming order.quote_id is the relevant field
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      const reviews = await this.rider.getOrderReviews(order.id);
      const order_stages_arr = await this.rider.getRequestOrderStages(order.id);


      // console.log("order_stages_arr:", order_stages_arr)

      order = {
        ...order,
        formatted_start_date: helpers.formatDateToUK(order?.start_date),
        jobStatus,
        qrCodeAttachment,
        parcels: parcels,
        vias: vias,
        invoices: invoices,
        viasCount: viasCount,
        reviews: reviews,
        order_stages: order_stages_arr,
      };

      const siteSettings = res.locals.adminData;
      // console.log("order:", order);

      // Return the order details along with parcels and vias
      return res.status(200).json({
        status: 1,
        msg: "Order details fetched successfully.",
        orders: order, // Add vias to the response
        siteSettings,
        paymentMethods,
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

      // console.log(req.body); // Log request body for debugging

      // Check if token is provided
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      // Validate the member type
      if (memType === "rider") {
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

      // Fetch payment methods for the user
      const paymentMethods =
        await this.paymentMethodModel.getPaymentMethodsByUserId(
          member.id,
          memType
        );

      // Decode payment methods
      const decodedPaymentMethods = paymentMethods.map((method) => {
        return {
          id: method.id,
          user_id: method.user_id,
          user_type: method.user_type,
          payment_method_id: helpers.doDecode(method.payment_method_id),
          card_number: helpers.doDecode(method.card_number),
          exp_month: helpers.doDecode(method.exp_month),
          exp_year: helpers.doDecode(method.exp_year),
          brand: helpers.doDecode(method.brand),
          is_default: method.is_default, // Assuming is_default does not need decoding
          created_date: method.created_date,
          encoded_id: helpers.doEncode(method.id),
        };
      });

      // Fetch site settings or other additional data
      const siteSettings = res.locals.adminData;

      // Combine member data, site settings, and payment methods
      const jsonResponse = {
        status: 1,
        msg: "Payment methods fetched successfully.",
        member,
        siteSettings,
        paymentMethods: decodedPaymentMethods,
      };

      // Return the combined JSON response
      return res.status(200).json(jsonResponse);
    } catch (err) {
      console.error("Error:", err.message);
      return res.status(500).json({ status: 0, msg: "Internal Server Error" });
    }
  }
  async ensureCustomerId(member) {
    try {
      // If member already has a customer_id, return it
      if (member.customer_id) return member.customer_id;

      // 1. Create a new customer in Stripe
      const stripeCustomer = await stripe.customers.create({
        name: member.full_name,
        email: member.email,
      });

      const customerId = stripeCustomer.id;

      // 2. Update member in DB with new customer_id
      await this.member.updateMemberData(member.id, { customer_id: customerId });


      return customerId;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw new Error("Failed to create customer ID.");
    }
  }


  async addPaymentMethod(req, res) {
    try {
      const {
        payment_method_id,
        card_exp_month,
        card_exp_year,
        card_number,
        token,
        memType,
      } = req.body;

      // Validate input fields
      if (
        !payment_method_id ||
        !card_exp_month ||
        !card_exp_year ||
        !card_number ||
        !token ||
        !memType
      ) {
        return res
          .status(200)
          .json({ status: 0, msg: "All fields are required." });
      }

      // Validate member type (user or rider)
      if (memType === "rider" && memType !== "rider") {
        return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }

      // Validate token and retrieve member details
      const memberResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );
      if (memberResponse.status === 0) {
        return res.status(200).json(memberResponse);
      }

      const member = memberResponse.user;
      if (!member) {
        return res.status(200).json({ status: 0, msg: "Member not found." });
      }
      // Ensure member has a customer_id in Stripe
      const customerId = await this.ensureCustomerId(member);
      if (!customerId) {
        return res.status(200).json({
          status: 0,
          msg: "Unable to generate customer ID for member.",
        });
      }

      // Retrieve the payment method from Stripe using the payment method ID
      const paymentMethod = await stripe.paymentMethods.retrieve(
        payment_method_id
      );

      if (!paymentMethod) {
        return res
          .status(200)
          .json({ status: 0, msg: "Payment method not found." });
      }

      // Validate expiration month/year and card number
      if (
        paymentMethod.card.exp_month !== parseInt(card_exp_month) ||
        paymentMethod.card.exp_year !== parseInt(card_exp_year)
      ) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid expiration date." });
      }

      if (paymentMethod.card.last4 !== card_number) {
        return res
          .status(200)
          .json({ status: 0, msg: "Card number does not match." });
      }

      // Attach the payment method to the customer in Stripe
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customerId,
      });

      // Set the payment method as the default payment method for the customer
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: payment_method_id },
      });

      // Check if the user already has a payment method
      const existingMethods =
        await this.paymentMethodModel.getDefaultPaymentMethodByUserId(
          member.id
        );
      const isDefault = existingMethods.length === 0 ? 1 : 0;

      // Insert the retrieved payment method into the database
      const newPaymentMethod = {
        user_id: member.id,
        user_type: memType,
        customer_id: helpers.doEncode(customerId), // Attach customer_id
        payment_method_id: helpers.doEncode(paymentMethod.id),
        card_number: helpers.doEncode(paymentMethod.card.last4),
        exp_month: helpers.doEncode(paymentMethod.card.exp_month),
        exp_year: helpers.doEncode(paymentMethod.card.exp_year),
        brand: helpers.doEncode(paymentMethod.card.brand),
        is_default: isDefault,
      };
      const insertedPaymentMethod =
        await this.paymentMethodModel.addPaymentMethod(newPaymentMethod);

      return res.status(200).json({
        status: 1,
        msg: "Payment method added successfully.",
        paymentMethod: insertedPaymentMethod,
      });
    } catch (err) {
      console.error("Error adding payment method:", err.message);
      return res.status(200).json({ status: 0, msg: "Internal Server Error" });
    }
  }

  async deletePaymentMethod(req, res) {
    try {
      const { payment_method_id, token, memType } = req.body;

      // Validate request fields
      if (!payment_method_id || !token || !memType) {
        return res
          .status(400)
          .json({ status: 0, msg: "All fields are required." });
      }

      // Validate member type
      if (memType === "rider") {
        return res.status(400).json({ status: 0, msg: "Invalid member type." });
      }

      // Validate token and get member
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(400).json(userResponse);
      }

      const member = userResponse.user;
      if (!member) {
        return res.status(404).json({ status: 0, msg: "User not found." });
      }

      // Fetch payment method from the database
      const paymentMethod =
        await this.paymentMethodModel.getPaymentMethodsByIdAndUserId(
          payment_method_id,
          member.id
        );
      if (!paymentMethod) {
        return res
          .status(200)
          .json({ status: 0, msg: "Payment method not found." });
      }
      const paymentMethodRow = paymentMethod[0];

      // Ensure payment_method_id is a string before detaching
      const paymentMethodId = helpers.doDecode(
        paymentMethodRow?.payment_method_id
      ); // Convert to string
      // console.log(paymentMethodId)
      // Check if the payment method exists in Stripe before detaching
      try {
        const stripePaymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );
        if (!stripePaymentMethod) {
          return res
            .status(200)
            .json({ status: 0, msg: "Payment method not found in Stripe." });
        }
      } catch (stripeError) {
        console.error("Stripe error:", stripeError.message);
        return res
          .status(404)
          .json({ status: 0, msg: "Payment method not found in Stripe." });
      }

      // Delete payment method from Stripe
      await stripe.paymentMethods.detach(paymentMethodId);

      // Delete payment method from database
      await this.paymentMethodModel.deletePaymentMethodById(
        paymentMethodRow.id
      );

      return res
        .status(200)
        .json({ status: 1, msg: "Payment method deleted successfully." });
    } catch (error) {
      console.error("Error deleting payment method:", error.message);
      return res.status(500).json({ status: 0, msg: "Internal Server Error" });
    }
  }

  async markPaymentMethodAsDefault(req, res) {
    try {
      const { payment_method_id, token, memType } = req.body;

      // Validate request fields
      if (!payment_method_id || !token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "All fields are required." });
      }

      // Validate member type
      if (memType === "rider") {
        return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }

      // Validate token and get member
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const member = userResponse.user;
      if (!member) {
        return res.status(200).json({ status: 0, msg: "User not found." });
      }

      // Fetch payment method from the database
      const paymentMethod =
        await this.paymentMethodModel.getPaymentMethodsByIdAndUserId(
          payment_method_id,
          member.id
        );
      if (!paymentMethod || paymentMethod.length === 0) {
        return res
          .status(200)
          .json({ status: 0, msg: "Payment method not found." });
      }
      const paymentMethodRow = paymentMethod[0];

      // Set all other payment methods' is_default to 0
      await this.paymentMethodModel.setAllPaymentMethodsAsNotDefault(member.id);

      // Update the selected payment method's is_default to 1 in the database
      await this.paymentMethodModel.setPaymentMethodAsDefault(
        paymentMethodRow.id
      );

      // Update the payment method in Stripe to be the default
      const paymentMethodId = helpers.doDecode(
        paymentMethodRow?.payment_method_id
      ); // Convert to string
      await stripe.customers.update(member.customer_id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      return res.status(200).json({
        status: 1,
        msg: "Payment method marked as default successfully.",
      });
    } catch (error) {
      console.error("Error marking payment method as default:", error.message);
      return res.status(200).json({ status: 0, msg: "Internal Server Error" });
    }
  }

  async getNotifications(req, res) {
    try {
      // Extract the required details from the request
      const { token, memType } = req.body;

      // Validate input
      if (!token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Token and memType are required." });
      }

      // Validate the token and retrieve the user data
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );

      if (validationResponse.status === 0) {
        // Token validation failed
        return res.status(200).json(validationResponse);
      }

      // Extract the user object and ID from validation response
      const user = validationResponse.user;
      const userId = user.id;

      // Fetch notifications for the user and memType
      const notifications = await this.member.getNotifications(userId, memType);
      const siteSettings = res.locals?.adminData;

      // Transform notifications array
      const notificationsArr = notifications.map((notificationObj) => {
        if (notificationObj?.sender === 0 && siteSettings) {
          return {
            ...notificationObj,
            sender_name: siteSettings.site_name,
            sender_dp: siteSettings.logo_image,
          };
        }
        return notificationObj;
      });

      // console.log("Final notificationsArr:", notificationsArr); // Debugging log

      // Return the fetched notifications
      return res.status(200).json({
        status: 1,
        msg: "Notifications fetched successfully.",
        notifications: notificationsArr,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error.message);
      return res.status(500).json({ status: 0, msg: "Internal Server Error" });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { id } = req.params; // Notification ID to be deleted
      const { token, memType } = req.body; // Token and memType from the request body
      // console.log("requset:",req.body);

      // Validate the token and memType
      if (!token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Token and memType are required." });
      }

      // Validate token and get the user
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );
      if (validationResponse.status === 0) {
        return res.status(200).json({ status: 0, msg: validationResponse.msg });
      }

      const user = validationResponse.user;
      // console.log(req.params.id, "Notification ID");
      // console.log(req.body.token, "Token");
      // console.log(req.body.memType, "Member Type");

      // Verify if the notification exists and belongs to the user
      const notificationResult = await this.member.getNotificationById(id);
      const notification = notificationResult; // Access the first object in the array

      // console.log("Notification from DB", notification);
      if (
        !notification ||
        notification.user_id !== user.id ||
        notification.mem_type !== memType
      ) {
        // console.log(notification, "Notification from DB");
        // console.log(user.id, "Validated User ID");
        // console.log(notification.user_id, "Notification User ID");
        // console.log(memType, "Provided Member Type");
        return res
          .status(200)
          .json({ status: 0, msg: "Notification not found or unauthorized." });
      }
      // console.log(user.id, "Validated User ID");
      // console.log(notification.user_id, "Notification User ID");

      // Delete the notification
      await Member.deleteNotification(id);

      return res
        .status(200)
        .json({ status: 1, msg: "Notification deleted successfully." });
    } catch (error) {
      console.error("Failed to delete notification:", error.message);
      return res
        .status(200)
        .json({ status: 0, msg: "Failed to delete notification." });
    }
  }

  // router.post('/create-payment-intent', async (req, res) => {
  async createPaymentIntent(req, res) {
    try {
      const { amount, paymentMethod, payment_method, payment_method_id, requestId } =
        req.body;
      // console.log(req.body);

      if (!amount || !paymentMethod) {
        return res
          .status(200)
          .json({ error: "Amount and payment method are required" });
      }

      // ✅ Prevent double payment
      const dueAmount = await RequestQuoteModel.calculateDueAmount(requestId);
      // console.log("dueAmount payment intent", dueAmount, requestId)

      if (dueAmount <= 0) {
        return res.status(200).json({
          status: 0,
          error: "This invoice has already been fully paid."
        });
      }


      // Create a PaymentIntent with the specified amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert amount to cents (for Stripe)
        currency: "gbp",
        automatic_payment_methods: { enabled: true }, // Simplify configuration
      });

      res.status(200).json({ paymentIntentId: paymentIntent.id, status: 1 });
    } catch (error) {
      console.error(error);
      res.status(200).json({ error: error.message });
    }
  }
  async createSimplePaymentIntent(req, res) {
    try {
      const { amount } = req.body;
      // console.log(req.body);

      if (!amount) {
        return res.status(200).json({ error: "Amount required" });
      }

      // Create a PaymentIntent with the specified amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert amount to cents (for Stripe)
        currency: "gbp",
        payment_method_types: ["card"],
      });

      res
        .status(200)
        .json({ clientSecret: paymentIntent.client_secret, status: 1 });
    } catch (error) {
      console.error(error);
      res.status(200).json({ error: error.message });
    }
  }

  async createInvoice(req, res) {
    try {
      const {
        payment_method_id,
        payment_intent_id,
        amount,
        card_holder_name,
        requestId,
        payment_method,
        token,
        memType,
        saved_card_id,
      } = req.body;
      // console.log(req.body,'req.body')

      // ✅ Prevent double payment
      const dueAmount = await RequestQuoteModel.calculateDueAmount(requestId);
      // console.log("dueAmount", dueAmount)
      if (dueAmount <= 0) {
        return res.status(200).json({
          status: 0,
          msg: "This invoice has already been fully paid."
        });
      }


      // Validate the required fields
      if (payment_method == "credit-card") {
        if (
          !payment_method_id ||
          !payment_intent_id ||
          !amount ||
          !card_holder_name ||
          !requestId ||
          !payment_method
        ) {
          return res.status(200).json({ error: "All fields are required." });
        }
      } else if (payment_method == "saved-card") {
        if (!amount || !requestId || !payment_method || !saved_card_id) {
          return res.status(200).json({ error: "All fields are required." });
        }
      } else {
        if (!amount || !requestId || !payment_method) {
          return res.status(200).json({ error: "All fields are required." });
        }
      }

      if (!token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Token and memType are required." });
      }

      // Validate token and get the user
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );
      if (validationResponse.status === 0) {
        return res.status(200).json({ status: 0, msg: validationResponse.msg });
      }

      const user = validationResponse.user;
      const userId = user.id;
      // const riderId = validationResponse.user.id;
      let order = await this.member.getUserOrderDetailsById({
        userId: userId,
        requestId: requestId,
      });
      const selectedVehicle = await Vehicle.getSelectedVehicleById(order.selected_vehicle);
      if (!order) {
        return res.status(200).json({ status: 0, msg: "Invalid request!" });
      }
      // Define necessary variables
      const locType = ""; // Set this based on your application's logic
      const amountType = ""; // Set this based on your application's logic
      const status = 1; // Invoice status
      const via_id = null;
      const paymentType = "payment"; // Payment type
      const createdDate = Math.floor(Date.now() / 1000); // Current timestamp in seconds

      // Format the amounts before processing them
      const formattedAmount = helpers.formatAmount(amount);
      const charges = formattedAmount; // Amount to be charged, formatted

      // Call the model function to create the invoice
      let result = {};
      let invoice_id = null;
      if (payment_method === "credit-card") {
        result = await this.rider.createInvoiceEntry(
          requestId,
          charges,
          amountType,
          status,
          locType,
          via_id, // via_id is mapped to paymentId
          paymentType,
          payment_intent_id,
          payment_method_id,
          payment_method
        );
        invoice_id = result.insertId;
      } else if (payment_method === "credits") {
        if (user?.total_credits <= 0) {
          return res
            .status(200)
            .json({ status: 0, msg: "Insufficient balance!" });
        }
        if (user?.total_credits <= parseFloat(charges)) {
          return res
            .status(200)
            .json({ status: 0, msg: "Insufficient balance!" });
        }
        let payment_intent_id = "";
        let payment_method_id = "";
        result = await this.rider.createInvoiceEntry(
          requestId,
          charges,
          amountType,
          status,
          locType,
          via_id, // via_id is mapped to paymentId
          paymentType,
          payment_method
        );
        invoice_id = result.insertId;
        await this.member.updateMemberData(userId, {
          total_credits: parseFloat(user?.total_credits) - parseFloat(charges),
        });
      } else if (payment_method === "paypal") {
        let payment_intent_id = "";
        let payment_method_id = "";
        result = await this.rider.createInvoiceEntry(
          requestId,
          charges,
          amountType,
          0,
          locType,
          via_id, // via_id is mapped to paymentId
          paymentType,
          payment_method
        );
        invoice_id = result.insertId;
      } else if (payment_method === "saved-card") {
        if (!saved_card_id) {
          return res.status(200).json({ status: 0, msg: "Card is required." });
        }
        const decodedId = helpers.doDecode(saved_card_id);
        // console.log('Decoded ID:', decodedId); // Check decoded value

        if (!decodedId) {
          return res.status(200).json({ status: 0, msg: "Invalid Card." });
        }

        // Fetch the payment method from the database
        const paymentMethod =
          await this.paymentMethodModel.getPaymentMethodById(decodedId);
        // console.log(paymentMethod,"payment method");

        if (!paymentMethod) {
          return res.status(200).json({ status: 0, msg: "Card not found." });
        }

        // Decode Stripe payment method ID stored in the database
        const stripe_payment_method_id = helpers.doDecode(
          paymentMethod?.payment_method_id
        );
        if (!stripe_payment_method_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid Stripe Payment Method ID." });
        }

        // Retrieve the payment method details from Stripe
        let stripePaymentMethod;
        try {
          stripePaymentMethod = await stripe.paymentMethods.retrieve(
            stripe_payment_method_id
          );
        } catch (error) {
          return res.status(200).json({
            status: 0,
            msg: "Error retrieving Stripe payment method.",
            error: error.message,
          });
        }

        // Ensure the payment method is attached to a customer
        if (!stripePaymentMethod || !stripePaymentMethod.customer) {
          return res.status(200).json({
            status: 0,
            msg: "Payment method is not linked to a customer.",
          });
        }

        // Create a payment intent to charge the user
        let paymentIntent;
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(formattedAmount * 100),
            currency: "usd",
            customer: stripePaymentMethod.customer,
            payment_method: stripe_payment_method_id,
            confirm: true,
            use_stripe_sdk: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",
            },
            metadata: { user_id: userId },
          });
        } catch (error) {
          console.error("Stripe Error:", error);
          return res.status(200).json({
            status: 0,
            msg: "Error creating payment intent.",
            error: error.message,
          });
        }

        // Check the payment status
        if (paymentIntent.status !== "succeeded") {
          return res.status(200).json({
            status: 0,
            msg: "Payment failed.",
            paymentStatus: paymentIntent.status,
          });
        }
        let payment_intent_id = paymentIntent.id;
        let payment_method_id = stripe_payment_method_id;
        result = await this.rider.createInvoiceEntry(
          requestId,
          charges,
          amountType,
          status,
          locType,
          via_id, // via_id is mapped to paymentId
          paymentType,
          payment_intent_id,
          payment_method_id,
          payment_method
        );
        invoice_id = result.insertId;
      }

      const isPendingPayment = order.status === "pending_payment";

      if (payment_method !== "paypal") {
        const created_time = helpers.getUtcTimeInSeconds();

        if (isPendingPayment) {
          // ── NEW: pending_payment flow ──────────────────────────────

          // 1. Calculate total transaction amount:
          //    original paid amount + all handball + all waiting charges


          const invoiceEntries = await this.rider.getInvoicesByRequestId(requestId);

          const totalHandball = invoiceEntries
            .filter(inv => inv.amount_type === "handball")
            .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

          const totalWaiting = invoiceEntries
            .filter(inv => inv.amount_type === "waiting")
            .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

          const originalAmount = parseFloat(order.total_amount || 0);

          const transactionAmount = helpers.formatAmount(
            originalAmount + totalHandball + totalWaiting
          );



          // 2. Insert transaction entry with full amount
          await helpers.storeTransaction({
            user_id: userId,
            amount: transactionAmount,
            payment_method: payment_method,
            transaction_id: requestId,
            created_time: created_time,
            status: "paid",
            payment_intent_id: payment_intent_id,
            payment_method_id: payment_method_id,
            type: "Invoice",
          });

          await helpers.updateRequestQuoteJobStatus(order?.id);
          // await helpers.updateRequestStatus(order?.id, "completed"); // update jobStatus too

          //    rider base amount + handball charges + waiting charges
          const riderBaseAmount = await helpers.calculateRiderPrice({
            totalMiles: parseFloat(order.distance || 0),
            minMiles: selectedVehicle?.rider_min_mileage,
            minPrice: selectedVehicle?.rider_min_price,
            riderPrice: order?.rider_price,
          });

          const riderTotalEarning = parseFloat(
            (riderBaseAmount + totalHandball + totalWaiting).toFixed(2)
          );

          if (riderTotalEarning > 0) {
            const earningsData = {
              user_id: order?.assigned_rider,
              amount: riderTotalEarning,
              type: "credit",
              status: "pending",
              created_time: Math.floor(Date.now() / 1000),
              order_id: order?.id,
            };
            await helpers.insertEarnings(earningsData);
          }

        } else {
          // ── EXISTING: normal flow (unchanged) ─────────────────────
          await helpers.storeTransactionLogs({
            user_id: userId,
            amount: formattedAmount,
            payment_method: payment_method,
            transaction_id: requestId,
            created_time: created_time,
            status: "paid",
            payment_intent_id: payment_intent_id,
            payment_method_id: payment_method_id,
            type: "Invoice",
          });
        }
      }
      let adminData = res.locals.adminData;
      // const request = await this.rider.getRequestById(54, 9);
      const userRow = await this.rider.findById(order.assigned_rider);
      const parcels = await this.rider.getParcelDetailsByQuoteId(requestId);
      const order_stages_arr = await this.rider.getRequestOrderStages(requestId);
      const dueAmountchk = await RequestQuoteModel.calculateDueAmount(order.id);
      const orderDetailsLink = `/rider-dashboard/order-details/${helpers.doEncode(
        requestId
      )}`;
      let request_row = order;
      const requestRow = {
        ...request_row, // Spread request properties into order
        parcels: parcels,
        order_stages: order_stages_arr
      };
      if (parseFloat(dueAmountchk) <= 0) {
        const updatedRequest = await helpers.updateRequestStatus(
          order?.id,
          "completed"
        );

        await processRiderCharges({
          order_id: order?.id,
          rider_id: order.assigned_rider,
          adminData: res.locals.adminData
        });


        const riderNotification = `Customer has completed payment for booking ${order?.booking_id}. The job is now completed.`;

        await helpers.storeNotification(
          order.assigned_rider, // ✅ rider
          "rider",
          userId,               // ✅ user is sender
          riderNotification,
          orderDetailsLink
        );

        const userNotification = `Your payment has been received and your delivery for booking ${order?.booking_id} is now completed.`;

        await helpers.storeNotification(
          userId,               // ✅ user
          "user",
          order.assigned_rider, // ✅ rider is sender
          userNotification,
          orderDetailsLink
        );
        // console.log(
        //   "Assigned Rider:",
        //   order?.assigned_rider,
        //   "User ID:",
        //   userId
        // );

        const allStages = await this.rider.getOrderStages(order.id);
        await this.rider.attachStageAttachments(allStages);
        order.stages = allStages;

        await helpers.sendEmail(
          userRow?.email,
          `Payment received for booking ${order?.booking_id}`,
          "request-invoice-paid",
          {
            adminData,
            order: requestRow,
            rider: userRow,
            type: "rider",
          }
        );

        await helpers.sendEmail(
          userRow.email,
          `Delivery completed for booking ${order?.booking_id}`,
          "job-completed",
          {
            adminData,
            order: requestRow,
            rider: userRow,
            stages: allStages, // ✅ attachments included
            BASE_URL: process.env.BASE_URL,
            type: "user",
          }
        );
      }

      if (parseFloat(dueAmountchk) <= 0) {

        const distance = parseFloat(order.distance || 0); // in km
        const riderPrice = parseFloat(order.rider_price || 0); // price per km

        // const formattedRiderAmount = parseFloat((distance * riderPrice)); // multiply and format'


        const formattedRiderAmount = await helpers.calculateRiderPrice({
          totalMiles: distance,
          minMiles: selectedVehicle?.rider_min_mileage,
          minPrice: selectedVehicle?.rider_min_price,
          riderPrice: order?.rider_price,
        });

        if (formattedRiderAmount > 0) {
          const created_time = Math.floor(Date.now() / 1000); // UTC seconds
          const earningsData = {
            user_id: order?.assigned_rider,
            amount: formattedRiderAmount,
            type: "credit",
            status: "pending",
            created_time,
            order_id: order?.id,
          };

          const insertedEarnings = await helpers.insertEarningLogs(earningsData);
          // console.log("Amount:", formattedRiderAmount);return;

          if (!insertedEarnings) {
            console.log("Failed to insert earnings for rider:", rider.user.id);
          }
        }
      } else {
        console.log("Due amount not cleared yet. Earnings will not be inserted.");
      }

      // console.log(result,'result')
      // Handle response
      if (result) {
        return res.status(200).json({
          message: "Invoice created successfully.",
          invoiceId: invoice_id,
          status: 1
        });
      } else {
        return res.status(200).json({ error: "Failed to create invoice." });
      }
    } catch (error) {
      console.error("Error in createInvoice:", error);
      return res.status(200).json({ error: "An error occurred." });
    }
  }
  async saveBusinessUserCredits(req, res) {
    try {
      const {
        invoice_id,
        payment_method_id,
        payment_intent_id,
        amount,
        card_holder_name,
        payment_method,
        token,
        memType,
        saved_card_id,
      } = req.body;
      // Validate the required fields
      if (payment_method == "credit-card") {
        if (
          !invoice_id ||
          !payment_method_id ||
          !payment_intent_id ||
          !amount ||
          !card_holder_name ||
          !payment_method
        ) {
          return res.status(200).json({ error: "All fields are required." });
        }
      } else if (payment_method == "saved-card") {
        if (!amount || !payment_method || !saved_card_id) {
          return res.status(200).json({ error: "All fields are required." });
        }
      } else if (payment_method == "paypal") {
        if (!amount || !payment_method) {
          return res.status(200).json({ error: "All fields are required." });
        }
      }

      if (!token || !memType) {
        return res
          .status(200)
          .json({ status: 0, msg: "Token and memType are required." });
      }

      // Validate token and get the user
      const validationResponse = await this.validateTokenAndGetMember(
        token,
        memType
      );
      if (validationResponse.status === 0) {
        return res.status(200).json({ status: 0, msg: validationResponse.msg });
      }

      const user = validationResponse.user;
      const userId = user.id;

      const status = 1; // Invoice status

      const paymentType = "payment"; // Payment type

      // Format the amounts before processing them
      const formattedAmount = helpers.formatAmount(amount);
      const charges = formattedAmount; // Amount to be charged, formatted

      // Call the model function to create the invoice
      let result = {};
      let payment_intent = payment_intent_id;
      let payment_methodid = payment_method_id;
      if (payment_method === "credit-card") {
      } else if (payment_method === "saved-card") {
        if (!saved_card_id) {
          return res.status(200).json({ status: 0, msg: "Card is required." });
        }
        const decodedId = helpers.doDecode(saved_card_id);
        // console.log('Decoded ID:', decodedId); // Check decoded value

        if (!decodedId) {
          return res.status(200).json({ status: 0, msg: "Invalid Card." });
        }

        // Fetch the payment method from the database
        const paymentMethod =
          await this.paymentMethodModel.getPaymentMethodById(decodedId);
        // console.log(paymentMethod,"payment method");

        if (!paymentMethod) {
          return res.status(200).json({ status: 0, msg: "Card not found." });
        }

        // Decode Stripe payment method ID stored in the database
        const stripe_payment_method_id = helpers.doDecode(
          paymentMethod?.payment_method_id
        );
        if (!stripe_payment_method_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Invalid Stripe Payment Method ID." });
        }

        // Retrieve the payment method details from Stripe
        let stripePaymentMethod;
        try {
          stripePaymentMethod = await stripe.paymentMethods.retrieve(
            stripe_payment_method_id
          );
        } catch (error) {
          return res.status(200).json({
            status: 0,
            msg: "Error retrieving Stripe payment method.",
            error: error.message,
          });
        }

        // Ensure the payment method is attached to a customer
        if (!stripePaymentMethod || !stripePaymentMethod.customer) {
          return res.status(200).json({
            status: 0,
            msg: "Payment method is not linked to a customer.",
          });
        }

        // Create a payment intent to charge the user
        let paymentIntent;
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(formattedAmount * 100),
            currency: "usd",
            customer: stripePaymentMethod.customer,
            payment_method: stripe_payment_method_id,
            confirm: true,
            use_stripe_sdk: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",
            },
            metadata: { user_id: userId },
          });
        } catch (error) {
          console.error("Stripe Error:", error);
          return res.status(200).json({
            status: 0,
            msg: "Error creating payment intent.",
            error: error.message,
          });
        }

        // Check the payment status
        if (paymentIntent.status !== "succeeded") {
          return res.status(200).json({
            status: 0,
            msg: "Payment failed.",
            paymentStatus: paymentIntent.status,
          });
        }
        let payment_intent_id = paymentIntent.id;
        let payment_method_id = stripe_payment_method_id;
        payment_intent = payment_intent_id;
        payment_methodid = payment_method_id;
      }
      if (payment_method != "paypal") {
        await this.member.updateMemberData(userId, {
          total_credits:
            parseFloat(user?.total_credits) + parseFloat(formattedAmount),
        });

        const invoice = await this.paymentMethodModel.getInvoiceById(
          invoice_id
        );
        if (!invoice) {
          return res.status(200).json({ status: 0, msg: "Invoice not found." });
        }

        // console.log("ids:",payment_intent,payment_methodid);return;

        const updateResult =
          await this.paymentMethodModel.updateInvoicePaymentDetails(
            invoice_id,
            {
              payment_intent_id: payment_intent,
              payment_method_id: payment_methodid,
              payment_intent: payment_intent,
              payment_method,
            }
          );
        if (updateResult.affectedRows > 0) {
          await helpers.storeTransactionLogs({
            user_id: userId,
            amount: formattedAmount,
            payment_method,
            transaction_id: 0,
            created_time: helpers.getUtcTimeInSeconds(),
            status: "paid",
            payment_intent_id: payment_intent,
            payment_method_id: payment_methodid,
            type: "credits",
          });
          const createdDate = helpers.getUtcTimeInSeconds();
          const creditEntry = {
            user_id: userId,
            type: "admin", // Change type to 'user' as per requirement
            credits: formattedAmount, // Credits used by the user
            created_date: createdDate,
            e_type: "credit", // Debit type entry
          };

          const result = await this.pageModel.insertInCredits(creditEntry);

          await this.pageModel.markCreditsAsPaid(userId);

          return res.status(200).json({
            status: 1,
            msg: "Payment successful & credits cleared.",
            invoiceId: result.insertId,
          });
        } else {
          return res
            .status(500)
            .json({ status: 0, msg: "Failed to update invoice." });
        }
      }
    } catch (error) {
      console.error("Error in createInvoice:", error);
      return res.status(200).json({ error: "An error occurred." });
    }
  }
  // Route to find the best route based on order details
  // app.post('/find-best-route', async (req, res) => {
  async findBestRoute(req, res) {
    const orderDetails = req.body.order_details; // Array of order details with source and destination

    // Ensure order_details is an array
    if (!Array.isArray(orderDetails)) {
      return res
        .status(200)
        .json({ status: 0, msg: "Invalid order_details format" });
    }

    // Calculate distances between each source and destination pair
    const distanceResults = [];

    for (let i = 0; i < orderDetails.length; i++) {
      const detail = orderDetails[i];
      const distance = await helpers.getDistance(
        detail.source,
        detail.destination
      );
      distanceResults.push({
        ...detail,
        distance: distance,
      });
    }

    // Sort the distances from shortest to longest
    distanceResults.sort((a, b) => a.distance - b.distance);

    // Return the sorted order details
    return res.status(200).json({
      status: 1,
      msg: "Sorted order details based on shortest to longest path",
      data: distanceResults,
    });
  }

  async submitReview(req, res) {
    const { orderId, userId, rating, review } = req.body;

    if (!orderId || !userId || !rating || !review) {
      return res.status(200).json({ message: "All fields are required" });
    }

    try {
      // Create a new review
      const newReview = await this.member.createReview(
        orderId,
        userId,
        rating,
        review
      );

      return res.status(200).json({
        message: "Review submitted successfully",
        review: newReview,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to submit review" });
    }
  }

  async checkAndInsertInvoices(req, res) {
    try {
      const [businessUsers] = await this.member.getApprovedBusinessUsers();

      if (!businessUsers.length) {
        return res
          .status(200)
          .json({ msg: "No approved business users found." });
      }
      let adminData = res.locals.adminData;
      let insertedUsers = [];
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString("default", {
        month: "long",
      });
      const currentYear = currentDate.getFullYear();
      const previousMonthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      const previousMonth = previousMonthDate.toLocaleString("default", {
        month: "long",
      });
      // console.log(businessUsers);return;
      for (const user of businessUsers) {
        const userId = user.id;
        const hasInvoice = await this.member.checkExistingInvoice(userId);
        const hasCreditsMonth = await this.member.checkExistingMonthCredits(
          userId
        );
        if (!hasInvoice && !hasCreditsMonth) {
          // const totalDebitAmount = await this.member.getTotalDebitCredits(
          //   userId
          // );
          const totalAmount = await this.member.getTotalPendingCredits(userId);
          // // console.log("totalDebitAmount:", totalDebitAmount);
          if (totalAmount > 0) {
            await this.member.insertInvoice(userId, totalAmount);
            insertedUsers.push(userId);
            const userRow = await this.member.findById(userId);

            const result = await helpers.sendEmail(
              userRow.email,
              `Your Monthly Invoice for Credits Used ${currentMonth + ", " + currentYear
              }`,
              "credit-invoice",
              {
                username: userRow?.full_name,
                adminData,
                credits: totalAmount,
                amount: helpers.formatAmount(totalAmount),
                previousMonth,
                currentMonth,
              }
            );
          }
        }
      }
      // console.log(insertedUsers,'insertedUsers')
      if (insertedUsers.length === 0) {
        return res.json({
          message: "All users already have an entry for this month.",
        });
      } else {
        res.json({
          message:
            "Entries added successfully for users without an entry this month.",
          users: insertedUsers,
        });
      }
    } catch (error) {
      console.error("Error checking and inserting credit invoices:", error);
      res.status(200).json({ error: "Internal server error." });
    }
  }

  async getInvoices(req, res) {
    try {
      const siteSettings = res.locals.adminData;

      const { token, memType } = req.body;
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      if (memType !== "business") {
        // Ensure the memType is 'rider'
        return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        // If validation fails, return the error message
        return res.status(200).json(userResponse);
      }
      const member = userResponse.user;
      const userId = member?.id;

      const paymentMethods =
        await this.paymentMethodModel.getPaymentMethodsByUserId(
          userId,
          memType
        );

      // Decode payment methods
      const decodedPaymentMethods = paymentMethods.map((method) => {
        return {
          id: method.id,
          user_id: method.user_id,
          user_type: method.user_type,
          payment_method_id: helpers.doDecode(method.payment_method_id),
          card_number: helpers.doDecode(method.card_number),
          exp_month: helpers.doDecode(method.exp_month),
          exp_year: helpers.doDecode(method.exp_year),
          brand: helpers.doDecode(method.brand),
          is_default: method.is_default, // Assuming is_default does not need decoding
          created_date: method.created_date,
          encoded_id: helpers.doEncode(method.id),
        };
      });

      const invoices = await this.member.getInvoicesByUserId(userId);
      // console.log("invoices:", invoices);


      // const requestQuote = await this.rider.getRequestQuoteByUserId(userId);
      // if (!requestQuote) {
      //   return res
      //     .status(200)
      //     .json({ status: 0, msg: "Request quote not found." });
      // }
      // console.log("userId:", userId);

      const order_id = invoices?.id
      // console.log("requestQuote:", requestQuote);
      res.json({
        invoices,
        order_id,
        siteSettings,
        paymentMethods: decodedPaymentMethods,
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(200).json({ error: "Internal server error" });
    }
  }

  async submitDeliveryFeedback(req, res) {
    try {
      const { token, memType, order_id, rating, services, recommend, comments } = req.body;

      if (!token || !memType || !order_id) {
        return res.status(400).json({
          status: 0,
          msg: "Token, member type and order id are required."
        });
      }

      // Validate member type
      if (memType === "rider") {
        return res.status(400).json({ status: 0, msg: "Invalid member type." });
      }

      // Validate token and get member
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(400).json(userResponse);
      }

      const member = userResponse.user;
      if (!member) {
        return res.status(404).json({ status: 0, msg: "Invalid token." });
      }

      if (!token) {
        return res.json({
          status: 0,
          msg: "Token missing",
        });
      }

      const userId = member?.id;

      if (!order_id) {
        return res.json({
          status: 0,
          msg: "Order ID required",
        });
      }

      const orderCheck = await RequestQuoteModel.getRequestQuoteById(order_id);
      if (!orderCheck) {
        return res
          .status(200)
          .json({ status: 0, msg: "Order not found." });
      }


      // prevent duplicate review
      const reviewCheck = await this.member.getDeliveryFeedbackByOrderIdAndMemberId(order_id, userId);

      if (reviewCheck && reviewCheck.length > 0) {
        return res.json({
          status: 0,
          msg: "Feedback already submitted",
        });
      }

      // insert review
      const reviewInsert = await this.member.insertDeliveryFeedback(
        order_id,
        userId,
        rating || null,
        recommend || null,
        comments || null
      );

      const review_id = reviewInsert.insertId;

      // Insert services
      if (services && Array.isArray(services) && services.length > 0) {
        for (const service of services) {
          await this.member.insertFeedbackService(review_id, service);
        }
      }

      return res.json({
        status: 1,
        msg: "Review submitted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.json({
        status: 0,
        msg: "Something went wrong",
      });
    }
  }

  // app.post('/send-email', async (req, res) => {
  async sendMailApi(req, res) {
    let imageUrl =
      "https://lh3.googleusercontent.com/a/ACg8ocKv3R5NekjaraAxt94bLLdWumu8magwLH9YzENjc3eh9t7Crpk=s100";
    const imageName = await helpers.uploadImageFromUrl(imageUrl);
    // console.log(imageName);
    return;
    const { email, username } = req.body;
    let adminData = res.locals.adminData;
    // const subject = "Parcel Request Confirmed: Awaiting Rider Assignment - FastUk";
    // let order = await this.member.getUserOrderDetailsById({
    //   userId: 1,
    //   requestId: 1
    // });
    // const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
    // order={...order,parcels:parcels,start_date:helpers.formatDateTimeToUK(order.start_date)}
    // const templateData = {
    //     username, // Pass username
    //     adminData,
    //     order,
    //     type:"user"
    // };

    // const result = await helpers.sendEmail(email, subject, 'request-quote', templateData);
    //   if (result.success) {
    //       res.status(200).json({ status: 1, msg: "Email sent successfully", messageId: result.messageId });
    //   } else {
    //       res.status(200).json({ status: 0, msg: "Email sending failed", error: result.error });
    //   }
    let order = await this.member.getUserOrderDetailsById({
      userId: 13,
      requestId: 54,
    });
    // const request = await this.rider.getRequestById(54, 9);
    const userRow = await this.member.findById(order.user_id);
    const parcels = await this.rider.getParcelDetailsByQuoteId(54);
    const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);
    let request_row = order;
    const requestRow = {
      ...request_row, // Spread request properties into order
      parcels: parcels, // Add parcels as an array inside order
    };
    if (parseFloat(dueAmount) <= 0) {
      const result = await helpers.sendEmail(
        userRow.email,
        "Invoice paid for: " + order?.booking_id,
        "request-invoice-paid",
        {
          adminData,
          order: requestRow,
          type: "user",
        }
      );
    }
  }
}

module.exports = MemberController;
