// controllers/api/RiderController.js
const BaseController = require("../baseController");
const Member = require("../../models/memberModel");
const Rider = require("../../models/riderModel");
const VehicleModel = require("../../models/api/vehicleModel");
const PageModel = require("../../models/api/pages"); // Assuming you have this model
const PaymentMethodModel = require("../../models/api/paymentMethodModel"); // Assuming you have this model
const RequestQuoteModel = require("../../models/request-quote"); // Assuming you have this model
const RemotePostCodeModel = require("../../models/remote-post-code"); // Assuming you have this model

const Token = require("../../models/tokenModel");
const Addresses = require("../../models/api/addressModel");
const {
  validateEmail,
  validatePhoneNumber,
  validateRequiredFields,
  validateFields
} = require("../../utils/validators");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const helpers = require("../../utils/helpers");
const { SMTP_MAIL, SMTP_PASSWORD } = process.env;
const Stripe = require("stripe");
const { pool } = require("../../config/db-connection");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
class MemberController extends BaseController {
  constructor() {
    super();
    this.member = new Member();
    this.rider = new Rider();
    this.pageModel = new PageModel();
    this.requestQuoteModel = new RequestQuoteModel();
    this.tokenModel = new Token();
    this.addressModel = new Addresses();
    this.paymentMethodModel = new PaymentMethodModel();
    this.remotePostCodeModel = new RemotePostCodeModel();
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
        addresses: addresses?.length <= 0 ? [] : addresses
      });
    } catch (error) {
      console.error("Error fetching addresses:", error.message);
      return res.status(200).json({
        status: 0,
        msg: "Server error.",
        details: error.message
      });
    }
  }
  async createReviewForRequest(req, res) {
    try {
      const { token, memType, review, rating, request_id } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
        return res.status(200).json({
          status: 0,
          msg: "Invalid member type. Only users can access this endpoint."
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
        rating: rating.trim(),
        created_at: created_at,
        user_id: user?.id,
        request_id: request_id
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
        const requestReview = await this.rider.createRequestReview(cleanedData);
        const orderDetailsLink = `/rider-dashboard/order-details/${helpers.doEncode(
          request_id
        )}`;

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
          msg: "Review Posted Successfully!"
        });
      }

      return res.status(200).json({
        status: 1,
        states: states
      });
    } catch (error) {
      console.error("Error in posting review:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
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
        memType
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
          msg: "Address  city, and postcode are required."
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
        default: isDefault
      };
      // console.log(newAddress)
      const insertedAddress = await this.addressModel.insertAddress(newAddress);

      // Fetch all addresses for the user
      const addresses = await this.addressModel.getAddressesByUserId(userId);

      return res.status(200).json({
        status: 1,
        msg: "Address added successfully.",
        addresses: addresses
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
        memType
      } = req.body;

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
          msg: "Address  city, and postcode are required."
        });
      }
      const address_row = await this.addressModel.getAddressById(
        address_id,
        userId
      );
      if (!address_row) {
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
        city
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
        addresses: addresses
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
  async deleteAddress(req, res) {
    try {
      const { token, address_id, memType } = req.body;

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
          msg: "Address is required."
        });
      }

      const insertedAddress = await this.addressModel.deleteAddress(address_id);

      // Fetch all addresses for the user
      const addresses = await this.addressModel.getAddressesByUserId(userId);

      return res.status(200).json({
        status: 1,
        msg: "Address deleted successfully.",
        addresses: addresses
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
      const { token, address_id, memType } = req.body;

      // Validate token
      if (!token) {
        return res.status(200).json({
          status: 0,
          msg: "Token is required."
        });
      }
      if (!memType) {
        return res.status(200).json({
          status: 0,
          msg: "memType is required."
        });
      }
      if (!address_id) {
        return res.status(200).json({
          status: 0,
          msg: "Address ID is required."
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
          msg: "Address not found or does not belong to the user."
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
          msg: "Failed to set address as default."
        });
      }
      // console.log(`Address ${address_id} set as default`);

      // Fetch updated addresses for the user
      const addresses = await this.addressModel.getAddressesByUserId(userId);
      if (!addresses || addresses.length === 0) {
        return res.status(200).json({
          status: 0,
          msg: "No addresses found."
        });
      }

      return res.status(200).json({
        status: 1,
        msg: "Address set as default successfully.",
        addresses: addresses
      });
    } catch (error) {
      console.error("Error in setAsDefaultAddress:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message
      });
    }
  }

  async requestQuote(req, res) {
    const vehicleModel = new VehicleModel();
    const { token, memType, address_id } = req.body;

    try {
      const siteSettings = res.locals.adminData;

      // Get the main page content
      const vehiclesData = await vehicleModel.findFeatured();

      let member = null;
      let paymentMethods = [];
      let addressesData = []; // Initialize an empty array


      const remotePostCodes =
        await RemotePostCodeModel.getRemotePostCodesInArray();

      // If a token is provided, decrypt it and fetch user details
      if (token && token !== "null") {
        // Validate memType
        if (memType === "rider") {
          return res
            .status(200)
            .json({ status: 0, msg: "Rider account cannot create request!" });
        }

        // Validate token and get member details
        const userResponse = await this.validateTokenAndGetMember(
          token,
          memType
        );

        if (userResponse.status === 0) {
          return res.status(200).json(userResponse); // Return error if token validation fails
        }

        member = userResponse.user;

        if (!member) {
          return res.status(200).json({ status: 0, msg: "Member not found." });
          
        }

        // if (address_id) {
          addressesData = await this.addressModel.getAddressesByUserId(member.id);
      // }
      console.log("result:",address_id,member.id)


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
            card_number: helpers.doDecode(method.card_number)
          }));
        }
      }

      // Combine the content and multi_text data
      const jsonResponse = {
        addressesData,
        siteSettings,
        vehicles: vehiclesData,
        member, // Null if no token was provided
        paymentMethods, // Simplified payment methods
        remotePostCodes // Add the remote post codes
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
      order_details
    } = req.body;

    // console.log(req.body);

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
      "charge_agreement",
      "card_holder_name",
      "confirm",
      "totalAmount",
      "payment_method",
      "payment_method_id"
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
        errors
      });
    }
    // console.log(memType)
    try {
      const siteSettings = res.locals.adminData;
      let parcel_price_obj = helpers.calculateParcelsPrice(
        order_details,
        siteSettings?.site_processing_fee
      );
      // console.log(parcel_price_obj);return;
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
          otp
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
      if (
        parcel_price_obj?.total == undefined ||
        parcel_price_obj?.total == null ||
        parseFloat(parcel_price_obj?.total) <= 5
      ) {
        return res.status(200).json({
          status: 0,
          message: "Price should be greater than 5"
        });
      }

      const formattedTotalPrice = helpers.formatAmount(parcel_price_obj?.total);

      // Handle payment logic
      const parsedAmount = parseFloat(formattedTotalPrice);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res
          .status(200)
          .json({ error: "Amount must be a positive number." });
      }

      // Create customer on Stripe
      const stripeCustomer = await stripe.customers.create({
        name: full_name,
        email: email
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
        setup_future_usage: "off_session"
      });

      // Respond with payment details
      return res.status(200).json({
        status: 1,
        user_id: userId,
        customer_id: stripeCustomer.id,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        authToken: token_arr?.authToken,
        mem_type: token_arr?.type
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return res.status(200).json({
        status: 0,
        message: "Failed to create payment intent",
        error: error.message
      });
    }
  }
  async updateApplePaymentStatus(req, res) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"];
    let event;
    console.log("req body", req.body);
    try {
      // Convert the raw Buffer to a string
      const rawBody = req.body.toString();

      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

      await helpers.storeWebHookData({
        type: "event created",
        response: JSON.stringify(event)
      });
    } catch (err) {
      await helpers.storeWebHookData({
        type: "⚠️ Webhook signature verification failed:",
        response: JSON.stringify(err)
      });
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process only successful payments
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.order_id;
      const paymentIntentId = paymentIntent.id;

      console.log(`✅ Apple Pay Payment Successful for Order: ${orderId}`);
      console.log(`💳 Payment Intent ID: ${paymentIntentId}`);

      if (orderId) {
        try {
          let order = await this.member.getUserOrderDetailsById({
            requestId: orderId
          });
          if (!order) {
            return res.status(200).json({ status: 0, msg: "Order not found." });
          }
          await this.member.updateRequestData(order.id, {
            status: "paid",
            payment_intent: paymentIntentId
          });
          await helpers.storeWebHookData({
            type: `💳 Payment Intent ID: ${paymentIntentId}`,
            response: `✅ Apple Pay Payment Successful for Order: ${orderId}`
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

  async createRequestQuote(req, res) {
    this.tokenModel = new Token();

    try {
      // Destructure necessary fields from req.body
      const {
        token,
        payment_intent_customer_id,
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
        payment_method,
        payment_method_id,
        vias,
        memType,
        date,
        notes,
        saved_card_id,
        order_details
      } = req.body;
      console.log("price:", price);

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

        // Fetch payment methods for the user

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
        // if (!parsedStartDate || isNaN(parsedStartDate)) {
        //   return res
        //     .status(200)
        //     .json({ status: 0, msg: "Invalid start_date format" });
        // }
        const siteSettings = res.locals.adminData;
        let parcel_price_obj = helpers.calculateParcelsPrice(
          order_details,
          siteSettings?.site_processing_fee
        );

        const formattedRiderPrice = helpers.formatAmount(rider_price || 0);
        const formattedVehiclePrice = helpers.formatAmount(price || 0);
        const formattedTotalAmount = helpers.formatAmount(
          parcel_price_obj?.total || 0
        );
        const formattedTax = helpers.formatAmount(parcel_price_obj?.tax || 0);

        // console.log("Remote price",formattedRemotePrice)
        // console.log("Remote price",remote_price)
        let clientSecret = "";
        let payment_intent_id = payment_intent_customer_id;
        let payment_methodid = payment_method_id;
        let requestQuoteId = "";
        if (payment_method === "credit-card") {
          requestQuoteId = await this.pageModel.createRequestQuote({
            user_id: userId, // Save the userId in the request
            selected_vehicle: selectedVehicle,
            rider_price: formattedRiderPrice,
            vehicle_price: formattedVehiclePrice,
            total_amount: formattedTotalAmount,
            tax: formattedTax,
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
            payment_method_id: payment_methodid,
            created_date: new Date(), // Set current date as created_date
            start_date: parsedStartDate,
            notes: notes
            // Pass start_date from the frontend
          });
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
              error: error.message
            });
          }

          // Ensure the payment method is attached to a customer
          if (!stripePaymentMethod || !stripePaymentMethod.customer) {
            return res.status(200).json({
              status: 0,
              msg: "Payment method is not linked to a customer."
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
                allow_redirects: "never"
              },
              metadata: { user_id: userId }
            });
          } catch (error) {
            console.error("Stripe Error:", error);
            return res.status(200).json({
              status: 0,
              msg: "Error creating payment intent.",
              error: error.message
            });
          }

          // Check the payment status
          if (paymentIntent.status !== "succeeded") {
            return res.status(200).json({
              status: 0,
              msg: "Payment failed.",
              paymentStatus: paymentIntent.status
            });
          }
          payment_intent_id = paymentIntent.id;
          payment_methodid = stripe_payment_method_id;
          // Prepare the object for requestQuoteId insertion
          requestQuoteId = await this.pageModel.createRequestQuote({
            user_id: userId,
            selected_vehicle: selectedVehicle,
            rider_price: formattedRiderPrice,
            vehicle_price: formattedVehiclePrice,
            total_amount: formattedTotalAmount,
            tax: formattedTax,
            payment_intent: paymentIntent.id, // Store the Payment Intent ID
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
            payment_method,
            saved_card_id, // Store the saved card ID
            created_date: new Date(),
            start_date: new Date(date),
            notes: notes
          });
        } else if (payment_method === "credits") {
          if (member?.total_credits <= 0) {
            return res
              .status(200)
              .json({ status: 0, msg: "Insufficient balance!" });
          }
          if (member?.total_credits <= parseFloat(formattedTotalAmount)) {
            return res
              .status(200)
              .json({ status: 0, msg: "Insufficient balance!" });
          }

          payment_intent_id = "";
          payment_methodid = "";
          // Prepare the object for requestQuoteId insertion
          requestQuoteId = await this.pageModel.createRequestQuote({
            user_id: userId,
            selected_vehicle: selectedVehicle,
            rider_price: formattedRiderPrice,
            vehicle_price: formattedVehiclePrice,
            total_amount: formattedTotalAmount,
            tax: formattedTax,
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
            payment_method,
            created_date: new Date(),
            start_date: new Date(date),
            notes: notes
          });
        } else if (payment_method === "apple-pay") {
          try {
            payment_intent_id = "";
            payment_methodid = "";
            // Prepare the object for requestQuoteId insertion
            requestQuoteId = await this.pageModel.createRequestQuote({
              user_id: userId,
              selected_vehicle: selectedVehicle,
              rider_price: formattedRiderPrice,
              vehicle_price: formattedVehiclePrice,
              total_amount: formattedTotalAmount,
              tax: formattedTax,
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
              payment_method,
              created_date: new Date(),
              start_date: new Date(date),
              notes: notes
            });
          } catch (error) {
            console.error("Stripe Error:", error);
            return res.status(200).json({
              status: 0,
              msg: "Error creating payment intent.",
              error: error.message
            });
          }
        }

        // Create Request Quote record

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
          parcelType: parcel.parcelType
        }));

        // Insert parcels into the database
        await this.pageModel.insertParcels(parcelRecords);

        const viaRecords = viasArr.map((via) => ({
          request_id: requestQuoteId,
          full_name: via.full_name,
          phone_number: via.phone_number,
          post_code: via.post_code,
          address: via.address,
          city: via.city
        }));

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

        // console.log("Order Details:", parsedOrderDetails);

        // Prepare order_details records
        const orderDetailsRecords = parsedOrderDetails.map((detail) => ({
          order_id: requestQuoteId,
          source_address: detail.source,
          destination_address: detail.destination,
          distance: detail.distance,
          height: detail.height,
          length: detail.length,
          width: detail.width,
          weight: detail.weight,
          parcel_number: detail.parcelNumber,
          parcel_type: detail.parcelType,
          price: helpers.formatAmount(detail?.price),
          source_lat: detail?.source_lat,
          source_lng: detail?.source_lng,
          destination_lat: detail?.destination_lat,
          destination_lng: detail?.destination_lng
        }));

        // Insert order details into the database
        await this.pageModel.insertOrderDetails(orderDetailsRecords);

        // console.log(userId,parcel_price_obj?.total,payment_method,requestQuoteId)
        if (payment_method === "credits") {
          await this.member.updateMemberData(member?.id, {
            total_credits:
              parseFloat(member?.total_credits) -
              parseFloat(formattedTotalAmount)
          });
          const createdDate = helpers.getUtcTimeInSeconds();

          const creditEntry = {
            user_id: userId,
            type: "user", // Change type to 'user' as per requirement
            credits: formattedTotalAmount, // Credits used by the user
            created_date: createdDate,
            e_type: "debit" // Debit type entry
          };

          await this.pageModel.insertInCredits(creditEntry);
        //   console.log("credit entry:",await this.pageModel.insertInCredits(creditEntry)
        // )
        //   return;
        };
        console.log(req.body)
      //  return;
        let apple_obj = {};
        if (payment_method === "apple-pay") {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(formattedTotalAmount * 100), // Convert amount to cents (for Stripe)
            currency: "gbp",
            metadata: {
              order_id: requestQuoteId // Pass the order_id from your database
            },
            payment_method_types: ["card"]
          });
          clientSecret = paymentIntent?.client_secret;
          apple_obj = {
            clientSecret: clientSecret,
            order_id: requestQuoteId,
            amount: parseFloat(formattedTotalAmount)
          };
        } else {
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
            }
          }

          const created_time = helpers.getUtcTimeInSeconds();

          // Insert Transaction Record
          await helpers.storeTransaction({
            user_id: userId,
            amount: formattedTotalAmount,
            payment_method: payment_method,
            transaction_id: requestQuoteId,
            created_time: created_time,
            payment_intent_id: payment_intent_id,
            payment_method_id: payment_methodid,
            type: "Request Quote"
          });
        }
        console.log("Successfully CREATED REQUEST", apple_obj);
        // Send success response
        res.status(200).json({
          status: 1,
          apple_obj: apple_obj,
          msg:
            payment_method === "apple-pay"
              ? "Request Quote created, now you'll be redirected to apple pay for transaction!"
              : "Request Quote, Parcels and vias created successfully",
          data: {
            requestId: requestQuoteId
          }
        });
      } else {
        return res.status(200).json({
          error: "Token is required"
        });
      }
    } catch (error) {
      console.error("Error in createRequestQuote:", error);
      res.status(200).json({
        error: "Internal server error",
        details: error.message
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

      const latestNotifications = await this.member.getLatestNotifications();
      // console.log("latestNotifications:",latestNotifications)

      const memberData = {
        ...userResponse?.user, // Spread existing user data
        latest_notifications: latestNotifications
      };
      // console.log("latestNotifications:",memberData?.latest_notifications)

      return res.status(200).json({
        status: 1,
        member: memberData,
        notifications_count: unreadCount
      });
    } catch (error) {
      console.error("Error in getMemberFromToken:", error);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while processing the request.",
        error: error.message
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
      console.log("Extracted Filename:", memImage);

      const imageUrl = `${memImage}`; // Adjust the path based on your frontend setup
      console.log("imageUrl:", imageUrl);

      // const imageUrl = `${memImage}`; // Customize the path based on your application structure if needed

      // Update the profile image in the database based on memType
      if (memType === "user" || memType === "business") {
        await this.member.updateMemberData(member.id, {
          mem_image: imageUrl
        });
      } else if (memType === "rider") {
        await this.rider.updateRiderData(member.id, {
          mem_image: imageUrl
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
        mem_image: imageUrl
      });
    } catch (error) {
      console.error("Error uploading profile image:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message
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
          msg: "First name, last name, phone number, and address are required."
        });
      }

      // Save the updated member data
      const updatedData = {
        full_name: first_name + " " + last_name,
        mem_phone,
        mem_address1: address,
        mem_bio: bio || "" // If bio is provided, use it; otherwise, set it to an empty string
      };

      // Check memType and update accordingly
      if (memType === "user" || memType === "business") {
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
        mem_name: first_name + " " + last_name
      });
    } catch (error) {
      console.error("Error updating profile:", error.message);
      return res.status(500).json({
        status: 0,
        msg: "Server error.",
        details: error.message
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
        memType
      } = req.body;

      // Check if all fields are provided
      if (!token || !current_password || !new_password || !confirm_password) {
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
          msg: "Current password is incorrect."
        });
      }

      // Hash the new password before saving
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update the user's password in the database
      const updatedData = {
        password: hashedPassword
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
          msg: "Invalid member type."
        });
      }

      return res.status(200).json({
        status: 1,
        msg: "Password updated successfully."
      });
    } catch (error) {
      console.error("Error changing password:", error.message);
      return res.status(200).json({
        status: 0,
        msg: "Server error.",
        details: error.message
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
        status: "accepted",
        limit: 3
      });
      const memberTotalOrders = await this.member.getOrdersByUserAndStatus({
        userId: member.id
      });
      const userInvoices = await this.member.getUserInvoices(member.id);
      const memberTotalAcceptedOrders =
        await this.member.getOrdersByUserAndStatus({
          userId: member.id,
          status: "accepted"
        });

      // console.log("User Orders before encoding:", memberOrders);

      // Encode the `id` for each order
      const ordersWithEncodedIds = memberOrders.map((order) => {
        const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
        return { ...order, encodedId }; // Add encodedId to each order
      });

      // console.log("Member Orders with Encoded IDs:", ordersWithEncodedIds);

      // Return the fetched orders with encoded IDs
      return res.status(200).json({
        status: 1,
        msg: "Orders fetched successfully.",
        orders: ordersWithEncodedIds,
        total_active_orders: memberTotalAcceptedOrders?.length,
        total_orders: memberTotalOrders?.length,
        total_invoices: userInvoices?.length
      });
    } catch (error) {
      console.error("Error in getRiderOrders:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  };
  getUserOrders = async (req, res) => {
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
        userId: member.id
      });

      // console.log("User Orders before encoding:", memberOrders);

      // Encode the `id` for each order
      const ordersWithEncodedIds = memberOrders.map((order) => {
        const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
        return { ...order, encodedId }; // Add encodedId to each order
      });

      // console.log("Member Orders with Encoded IDs:", ordersWithEncodedIds);

      // Return the fetched orders with encoded IDs
      return res.status(200).json({
        status: 1,
        msg: "Orders fetched successfully.",
        orders: ordersWithEncodedIds
      });
    } catch (error) {
      console.error("Error in getRiderOrders:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  };
  async getUserTransactions(req, res) {
    try {
      const { token, memType } = req.body;

      // Validate token and memType
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType === "rider") {
        // Ensure the memType is 'rider'
        return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }

      // Extract the logged-in rider ID from the token validation response
      const member = userResponse.user;
      const userId = member.id; // Assuming the `id` field contains the rider's unique ID

      // Call the model function to get the completed orders
      const transactions = await helpers.getTransaction(userId);

      // Return the response with the fetched orders and total order counts
      return res.status(200).json({
        status: 1,
        transactions
      });
    } catch (error) {
      console.error("Error fetching rider dashboard orders:", error.message);
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
        requestId: decodedId
      });

      // console.log("Order from DB:", order); // Add this line to log the order fetched from the database

      if (!order) {
        return res.status(200).json({ status: 0, msg: "Order not found." });
      }

      // Check if the assigned rider matches the logged-in rider
      if (order.user_id !== member.id) {
        return res
          .status(200)
          .json({ status: 0, msg: "This order does not belong to the user." });
      }
      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id); // Assuming order.quote_id is the relevant field
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      const reviews = await this.rider.getOrderReviews(order.id);
      // Calculate the due amount by summing the amount where status is 0
      // const dueAmount = await this.requestQuote.calculateDueAmount(order.id);
      // Calculate the paid amount and due amount
      const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);

      const formattedPaidAmount = helpers.formatAmount(paidAmount);
      const formattedDueAmount = helpers.formatAmount(dueAmount);

      order = {
        ...order,
        formatted_start_date: helpers.formatDateToUK(order?.start_date),
        encodedId: encodedId,
        parcels: parcels,
        vias: vias,
        invoices: invoices,
        dueAmount: formattedDueAmount,
        paidAmount: formattedPaidAmount,
        viasCount: viasCount,
        reviews: reviews
      };
      // Fetch parcels and vias based on the quoteId from the order
      // Assuming order.quote_id is the relevant field

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
          card_number: helpers.doDecode(method.card_number)
        }));
      }

      const siteSettings = res.locals.adminData;

      // Return the order details along with parcels and vias
      return res.status(200).json({
        status: 1,
        msg: "Order details fetched successfully.",
        order, // Add vias to the response
        siteSettings,
        paymentMethods
      });
    } catch (error) {
      console.error("Error in getOrderDetailsByEncodedId:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  }
  async getUserOrderDetailsByTrackingId(req, res) {
    try {
      const { token, memType } = req.body;
      // console.log(token)
      const { tracking_id } = req.params;

      let paymentMethods = [];
      if (!tracking_id) {
        return res
          .status(200)
          .json({ status: 0, msg: "Tracking ID is required." });
      }

      // console.log("Decoded ID:", decodedId); // Add this line to log the decoded ID

      // Fetch the order using the decoded ID and check if the rider_id matches the logged-in rider's ID
      let order = await this.member.getUserOrderDetailsByTrackingId({tracking_id: tracking_id});

      console.log("Order from DB:", order); // Add this line to log the order fetched from the database

      if (!order) {
        return res.status(200).json({ status: 0, msg: "Order not found." });
      }
      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id); // Assuming order.quote_id is the relevant field
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      const reviews = await this.rider.getOrderReviews(order.id);

      order = {
        ...order,
        formatted_start_date: helpers.formatDateToUK(order?.start_date),
        parcels: parcels,
        vias: vias,
        invoices: invoices,
        viasCount: viasCount,
        reviews: reviews
      };

      const siteSettings = res.locals.adminData;

      // Return the order details along with parcels and vias
      return res.status(200).json({
        status: 1,
        msg: "Order details fetched successfully.",
        orders:order, // Add vias to the response
        siteSettings,
        paymentMethods
      });
    } catch (error) {
      console.error("Error in getOrderDetailsByEncodedId:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
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
          encoded_id: helpers.doEncode(method.id)
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
        paymentMethods: decodedPaymentMethods
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
      const {
        payment_method_id,
        card_exp_month,
        card_exp_year,
        card_number,
        token,
        memType
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
      if (!member.customer_id) {
        return res
          .status(200)
          .json({ status: 0, msg: "Customer ID not found for member." });
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
        customer: member.customer_id
      });

      // Set the payment method as the default payment method for the customer
      await stripe.customers.update(member.customer_id, {
        invoice_settings: { default_payment_method: payment_method_id }
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
        customer_id: helpers.doEncode(member.customer_id), // Attach customer_id
        payment_method_id: helpers.doEncode(paymentMethod.id),
        card_number: helpers.doEncode(paymentMethod.card.last4),
        exp_month: helpers.doEncode(paymentMethod.card.exp_month),
        exp_year: helpers.doEncode(paymentMethod.card.exp_year),
        brand: helpers.doEncode(paymentMethod.card.brand),
        is_default: isDefault
      };
      const insertedPaymentMethod =
        await this.paymentMethodModel.addPaymentMethod(newPaymentMethod);

      return res.status(200).json({
        status: 1,
        msg: "Payment method added successfully.",
        paymentMethod: insertedPaymentMethod
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
        invoice_settings: { default_payment_method: paymentMethodId }
      });

      return res.status(200).json({
        status: 1,
        msg: "Payment method marked as default successfully."
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
      const notificationsArr = [];

      notifications.forEach((notificationObj) => {
        if (notificationObj?.sender === 0) {
          // Fetch sender info from site settings if sender is 0
          const siteSettings = res.locals?.adminData;
          if (siteSettings) {
            notificationObj.sender_name = siteSettings.site_name;
            notificationObj.sender_dp = siteSettings.logo_image;
          }
          notificationsArr.push(notificationObj);
        }
      });

      // Return the fetched notifications
      return res.status(200).json({
        status: 1,
        msg: "Notifications fetched successfully.",
        notifications: notificationsArr
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
      console.log(req.params.id, "Notification ID");
      console.log(req.body.token, "Token");
      console.log(req.body.memType, "Member Type");

      // Verify if the notification exists and belongs to the user
      const notificationResult = await Member.getNotificationById(id);
      const notification = notificationResult[0]; // Access the first object in the array

      console.log(notification, "Notification from DB");
      if (
        !notification ||
        notification.user_id !== user.id ||
        notification.mem_type !== memType
      ) {
        console.log(notification, "Notification from DB");
        console.log(user.id, "Validated User ID");
        console.log(notification.user_id, "Notification User ID");
        console.log(memType, "Provided Member Type");
        return res
          .status(200)
          .json({ status: 0, msg: "Notification not found or unauthorized." });
      }
      console.log(user.id, "Validated User ID");
      console.log(notification.user_id, "Notification User ID");

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
      const { amount, paymentMethod, payment_method, payment_method_id } =
        req.body;
      // console.log(req.body);

      if (!amount || !paymentMethod) {
        return res
          .status(200)
          .json({ error: "Amount and payment method are required" });
      }

      // Create a PaymentIntent with the specified amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert amount to cents (for Stripe)
        currency: "gbp",
        automatic_payment_methods: { enabled: true } // Simplify configuration
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
        payment_method_types: ["card"]
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
        saved_card_id
      } = req.body;
      // console.log(req.body,'req.body')
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
        await this.member.updateMemberData(userId, {
          total_credits: parseFloat(user?.total_credits) - parseFloat(charges)
        });
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
            error: error.message
          });
        }

        // Ensure the payment method is attached to a customer
        if (!stripePaymentMethod || !stripePaymentMethod.customer) {
          return res.status(200).json({
            status: 0,
            msg: "Payment method is not linked to a customer."
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
              allow_redirects: "never"
            },
            metadata: { user_id: userId }
          });
        } catch (error) {
          console.error("Stripe Error:", error);
          return res.status(200).json({
            status: 0,
            msg: "Error creating payment intent.",
            error: error.message
          });
        }

        // Check the payment status
        if (paymentIntent.status !== "succeeded") {
          return res.status(200).json({
            status: 0,
            msg: "Payment failed.",
            paymentStatus: paymentIntent.status
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
      }
      const created_time = helpers.getUtcTimeInSeconds();
      await helpers.storeTransaction({
        user_id: userId,
        amount: formattedAmount,
        payment_method: payment_method,
        transaction_id: requestId,
        created_time: created_time,
        payment_intent_id: payment_intent_id,
        payment_method_id: payment_method_id,
        type: "Invoice"
      });

      // console.log(result,'result')
      // Handle response
      if (result) {
        return res.status(200).json({
          message: "Invoice created successfully.",
          invoiceId: result.insertId
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
        saved_card_id
      } = req.body;
      console.log(req.body,'req.body')
      console.log(amount,'amount')
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
            error: error.message
          });
        }

        // Ensure the payment method is attached to a customer
        if (!stripePaymentMethod || !stripePaymentMethod.customer) {
          return res.status(200).json({
            status: 0,
            msg: "Payment method is not linked to a customer."
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
              allow_redirects: "never"
            },
            metadata: { user_id: userId }
          });
        } catch (error) {
          console.error("Stripe Error:", error);
          return res.status(200).json({
            status: 0,
            msg: "Error creating payment intent.",
            error: error.message
          });
        }

        // Check the payment status
        if (paymentIntent.status !== "succeeded") {
          return res.status(200).json({
            status: 0,
            msg: "Payment failed.",
            paymentStatus: paymentIntent.status
          });
        }
        let payment_intent_id = paymentIntent.id;
        let payment_method_id = stripe_payment_method_id;
        payment_intent = payment_intent_id;
        payment_methodid = payment_method_id;
      }

      await this.member.updateMemberData(userId, {
        total_credits:
          parseFloat(user?.total_credits) + parseFloat(formattedAmount)
      });

      const invoice = await this.paymentMethodModel.getInvoiceById(invoice_id);
        if (!invoice) {
            return res.status(200).json({ status: 0, msg: "Invoice not found." });
        }

        // console.log("ids:",payment_intent,payment_methodid);return;


        const updateResult = await this.paymentMethodModel.updateInvoicePaymentDetails(invoice_id, {
          payment_intent_id: payment_intent,
          payment_method_id: payment_methodid,
          payment_intent : payment_intent,
          payment_method
      });
      if (updateResult.affectedRows > 0) {
          await helpers.storeTransaction({
              user_id: userId,
              amount: formattedAmount,
              payment_method,
              transaction_id: 0,
              created_time: helpers.getUtcTimeInSeconds(),
              payment_intent_id: payment_intent,
              payment_method_id: payment_methodid,
              type: "credits"
          });
          const createdDate = helpers.getUtcTimeInSeconds();
          const creditEntry = {
            user_id: userId,
            type: "admin", // Change type to 'user' as per requirement
            credits: formattedAmount, // Credits used by the user
            created_date: createdDate,
            e_type: "credit" // Debit type entry
          };

          await this.pageModel.insertInCredits(creditEntry);

          return res.status(200).json({ status: 1, msg: "Credits added successfully.", invoiceId: result.insertId });
      } else {
          return res.status(500).json({ status: 0, msg: "Failed to update invoice." });
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
        distance: distance
      });
    }

    // Sort the distances from shortest to longest
    distanceResults.sort((a, b) => a.distance - b.distance);

    // Return the sorted order details
    return res.status(200).json({
      status: 1,
      msg: "Sorted order details based on shortest to longest path",
      data: distanceResults
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
        review: newReview
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

      let insertedUsers = [];

      for (const user of businessUsers) {
        const userId = user.id;
        const hasInvoice = await this.member.checkExistingInvoice(userId);
        const hasCreditsMonth = await this.member.checkExistingMonthCredits(userId);

        if (!hasInvoice && !hasCreditsMonth) {
          const totalDebitAmount = await this.member.getTotalDebitCredits(userId);
          console.log("totalDebitAmount:",totalDebitAmount)

          await this.member.insertInvoice(userId, totalDebitAmount);
          insertedUsers.push(userId);
        }
      }
      console.log(insertedUsers,'insertedUsers')
      if (insertedUsers.length === 0) {
        return res.json({
          message: "All users already have an entry for this month."
        });
      }
      else{
          res.json({
          message:
            "Entries added successfully for users without an entry this month.",
          users: insertedUsers
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
          encoded_id: helpers.doEncode(method.id)
        };
      });

      const invoices = await this.member.getInvoicesByUserId(userId);
      console.log("invoices:", invoices);
      res.json({ invoices, siteSettings, paymentMethods:decodedPaymentMethods });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(200).json({ error: "Internal server error" });
    }
  }
}

module.exports = MemberController;
