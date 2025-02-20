// controllers/api/RiderController.js
const BaseController = require("../baseController");
const Member = require("../../models/memberModel");

const Rider = require("../../models/riderModel");
const RiderModel = require("../../models/rider");
const Token = require("../../models/tokenModel");
const RequestQuoteModel = require("../../models/request-quote"); // Assuming you have this model
const MemberModel = require('../../models/member');
const VehicleModel = require('../../models/vehicle');

const {
  validateEmail,
  validatePhoneNumber,
  validateRequiredFields,
  validatePassword
} = require("../../utils/validators");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const helpers = require("../../utils/helpers");
const moment = require("moment");
const pool = require("../../config/db-connection");

class RiderController extends BaseController {
  constructor() {
    super();
    this.rider = new Rider();
    this.riderModel = new RiderModel();
    this.tokenModel = new Token();
    this.requestQuoteModel = new RequestQuoteModel();
    this.member = new Member();
    this.member_model = new MemberModel();
    this.vehicleModel = new VehicleModel();
  }

  async registerRider(req, res) {
    try {
      const {
        full_name,
        email,
        password,
        confirm_password,
        mem_phone,
        dob,
        mem_address1,
        city,
        vehicle_owner,
        vehicle_type,
        mem_verified,
        vehicle_registration_num,
        driving_license_num,
        driving_license,

        fingerprint // Keep fingerprint as a parameter
      } = req.body;
      // console.log(req.body)

      const is_approved = "pending";


      const cleanedData = {
        full_name: typeof full_name === "string" ? full_name.trim() : "",
        email: typeof email === "string" ? email.trim().toLowerCase() : "",
        password: typeof password === "string" ? password.trim() : "",
        confirm_password:
          typeof confirm_password === "string" ? confirm_password.trim() : "",
        mem_phone: typeof mem_phone === "string" ? mem_phone.trim() : "",
        dob: typeof dob === "string" ? dob.trim() : "",
        mem_address1:
          typeof mem_address1 === "string" ? mem_address1.trim() : "",
        city: typeof city === "string" ? city.trim() : "",
        vehicle_owner: vehicle_owner || 0,
        // vehicle_type:
        //   typeof vehicle_type === "string" ? vehicle_type.trim() : "",
        vehicle_registration_num:
          typeof vehicle_registration_num === "string"
            ? vehicle_registration_num.trim()
            : "",
        driving_license_num:
          typeof driving_license_num === "string"
            ? driving_license_num.trim()
            : "",
        driving_license:
          typeof driving_license === "string"
            ? driving_license.trim()
            : "",
        created_date: new Date(),
        status: 1,
        mem_verified: mem_verified || 0,
        is_approved: is_approved
      };
      // console.log(validateRequiredFields(cleanedData))
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
      //   const passwordValidation = validatePassword(cleanedData.password);
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

      // Phone number validation
      // if (!validatePhoneNumber(cleanedData.phone_number)) {
      //     return res.status(200).json({ status: 0, msg: 'Invalid phone number format. It should follow UK standards.' });
      // }

      // Check if email already exists
      const existingRider = await this.rider.findByEmail(cleanedData.email);
      // console.log(existingRider);return;
      if (existingRider) {
        return res.status(200).json({
          status: 0,
          msg: "Email already exists."
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

      cleanedData.customer_id = customer.id;
      cleanedData.vehicle_type=vehicle_type
      // Create the rider
      const riderId = await this.rider.createRider(cleanedData);
      // console.log('Created Rider ID:', riderId); // Log the created rider ID

      // Verify OTP was stored properly
      const createdRider = await this.rider.findById(riderId);
      // console.log('Created Rider:', createdRider); // Log the created rider

      // console.log('Stored OTP after creation:', createdRider.otp);

      // If fingerprint is not provided, generate a pseudo-fingerprint
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req); // Use let to allow reassignment

      // Generate a random number and create the token
      const randomNum = crypto.randomBytes(16).toString("hex");
      const tokenType = "rider";
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

      const token = helpers.generateToken(`${(riderId, "rider")}`);

      // Store the token in the tokens table
      await this.tokenModel.storeToken(
        riderId,
        token,
        tokenType,
        expiryDate,
        actualFingerprint
      );

      this.sendSuccess(
        res,
        { mem_type: tokenType, authToken: token, customer_id: customer.id },
        "Rider registered successfully."
      );
    } catch (error) {
      return res.status(200).json({
        // Changed to status 500 for server errors
        status: 0,
        msg: "An error occurred during registration.",
        error: error.message
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
  async loginRider(req, res) {
    try {
      let { email, password,fingerprint } = req.body;
      console.log(req.body);
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
      const existingRider = await this.rider.findByEmail(email);
      if (!existingRider) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email or password is incorrect." });
      }
      // console.log(existingRider);

      // Compare the provided password with the hashed password
      const passwordMatch = await bcrypt.compare(
        password,
        existingRider.password
      );
      if (!passwordMatch) {
        return res
          .status(200)
          .json({ status: 0, msg: "Email or password is incorrect." });
      }
      // console.log(password);

      // Generate a random number and create the token
      let actualFingerprint =
        fingerprint || this.generatePseudoFingerprint(req);
      const token = await this.storeAndReturnToken(
        existingRider.id,
        "rider",
        actualFingerprint
      );


      // Send success response
      this.sendSuccess(
          res,
          { mem_type: 'rider', authToken: token },
          "Successfully logged in."
        );
    } catch (error) {
      return res.status(200).json({
        success: false,
        message: "An error occurred during login.",
        error: error.message
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token, otp } = req.body;

      // Validate required fields
      if (!token || !otp) {
        return res
          .status(200)
          .json({ success: false, message: "Token and OTP are required." }); // Changed to 400 for bad request
      }
      // Find the token in the database
      const storedToken = await this.tokenModel.findByToken(token);
      if (!storedToken) {
        return res
          .status(200)
          .json({ success: false, message: "Invalid token." }); // Changed to 400 for invalid token
      }
      // console.log("storedToken:",storedToken[0])

      // Find the rider by stored token's rider ID
      const rider = await this.rider.findById(storedToken[0]?.rider_id);
      // console.log("rider id:",storedToken[0].rider_id)

      if (!rider) {
        return res
          .status(200)
          .json({ success: false, message: "Rider not found." }); // Use 404 when rider is not found
      }
      // console.log(rider[0])
      // console.log('Stored OTP:', rider.otp, 'Provided OTP:', otp);

      // Parse OTPs as integers to avoid comparison issues
      const storedOtp = parseInt(rider.otp, 10); // Parse stored OTP as an integer (base 10)
      const providedOtp = parseInt(otp, 10); // Parse provided OTP as an integer (base 10)

      // Verify OTP
      if (storedOtp !== providedOtp) {
        return res
          .status(200)
          .json({ success: false, message: "Incorrect OTP." }); // Changed to 400 for incorrect OTP
      }

      // If OTP matches, update the rider's verified status
      await this.rider.updateRiderVerification(rider.id);

      // // Remove or invalidate the token
      // await this.tokenModel.deleteToken(token);

      // Success response
      return res
        .status(200)
        .json({ success: true, message: "Email verified successfully." });
    } catch (error) {
      // Server error handling
      return res.status(200).json({
        success: false,
        message: "An error occurred during email verification.",
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
          msg: "No file uploaded."
        });
      }

      const riderLicense = req.file.filename;
      const imagePath = `${riderLicense}`; // Path to the uploaded file

      return res.status(200).json({
        status: 1,
        msg: "Image uploaded successfully.",
        imagePath
      });
    } catch (error) {
      return res.status(500).json({
        status: 0,
        msg: "An error occurred during image upload.",
        error: error.message
      });
    }
  };

  async getRequestQuotesByCity(req, res) {
    try {
      // Extract the token and memType from the request body
      const { token, memType, city } = req.body;

      // Check if the token is provided
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }
      // Call the method from BaseController to get the user data
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      // console.log("userResponse:",userResponse)

      // Check if the userResponse contains city info
      if (!userResponse || !userResponse?.user?.city) {
        return res
          .status(200)
          .json({ status: 0, msg: "City not found for the given token." });
      }
      // Validate and prioritize the city from the frontend
      const isCityValid = (city) =>
        city !== undefined &&
        city !== null &&
        typeof city === "string" &&
        city.trim().length > 0;

      const city_name = isCityValid(city)
        ? city.trim()
        : userResponse.user.city;

      // Fetch quotes by city using the model
      const requestQuotes = await this.rider.getRequestQuotesByCity(city_name);

      if (requestQuotes.length === 0) {
        return res
          .status(200)
          .json({ status: 0, msg: "No request quotes found for this city." });
      }

      // Fetch vias and parcels for each quote and construct the response
      // Sequentially fetch vias and parcels for each quote
      const enrichedQuotes = [];
      for (let quote of requestQuotes) {
        const user = await this.member.findById(quote.user_id);
        const vias = await this.rider.getViasByQuoteId(quote.id);
        // const parcels = await this.rider.getParcelsByQuoteId(quote.id);
        const parcels = await this.rider.getParcelDetailsByQuoteId(quote.id);

        if (user) {
          quote = {
            ...quote,
            user_name: user?.full_name,
            user_image: user?.mem_image
          };
        }
        enrichedQuotes.push({
          ...quote,
          booking_id: quote.booking_id,
          source_address: quote.source_address, // Include source address
          destination_address: quote.destination_address, // Include destination address
          vias,
          parcels
        });
        // console.log("enrichedQuotes:",enrichedQuotes)
      }

      return res.status(200).json({
        status: 1,
        msg: "Request quotes found.",
        requests: enrichedQuotes
      });
    } catch (error) {
      console.error(error);
      return res
        .status(200)
        .json({ status: 0, msg: "An error occurred.", error: error.message });
    }
  }

  async assignRiderToRequest(req, res) {
    try {
      const { token, memType, request_id } = req.body;
      // console.log(req.body);return;
      // Validate input
      if (!token || !memType || !request_id) {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "Token, memType, and requestId are required."
          });
      }
      // Step 1: Validate token and fetch user details
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return error from token validation
      }

      const loggedInUser = userResponse.user;
      // console.log(loggedInUser);return;

      // Step 2: Fetch the request quote by ID
      const requestQuote = await this.rider.getRequestQuoteById(request_id);
      if (!requestQuote) {
        return res
          .status(200)
          .json({ status: 0, msg: "Request quote not found." });
      }
      // console.log(requestQuote)

      // Step 3: Check if a rider is already assigned
      if (requestQuote.assigned_rider) {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "Rider is already assigned to this request."
          });
      }
      // console.log(requestQuote.assigned_rider)
      const userRow = await this.member.findById(requestQuote.user_id);
      if (!userRow) {
        return res
          .status(200)
          .json({ status: 0, msg: "Error fetching user" });
      }
      // Step 4: Assign the user ID to the assigned_rider column
      const updateStatus = await this.rider.assignRiderAndUpdateStatus(
        loggedInUser.id,
        request_id
      );
      // console.log("updateStatus:", updateStatus);

      if (updateStatus.affectedRows === 0) {
        return res
          .status(200)
          .json({ status: 0, msg: "Failed to assign rider to the request." });
      }
      let request_row = await this.rider.getRequestQuoteById(request_id);
      // console.log("request_row:",request_row)

      if (request_row) {
        const user = await this.member.findById(request_row.user_id);
        const vias = await this.rider.getViasByQuoteId(request_row.id);
        // const parcels = await this.rider.getParcelsByQuoteId(request_row.id);
        const parcels = await this.rider.getParcelDetailsByQuoteId(request_row.id);
        if (user) {
          request_row = {
            ...request_row,
            user_name: user?.full_name,
            user_image: user?.mem_image,
            vias: vias,
            parcels: parcels,
            rider_name: loggedInUser?.full_name
          };
        }
      }

      const encodedId = helpers.doEncode(String(request_id)); // Convert order.id to a string


      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

      // console.log(orderDetailsLink);return;
      // Step 6: Send notification to the user
      const notificationText = `Your request #${request_id} has been assigned to a rider.`;
      console.log("notification data",request_row.user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        loggedInUser.id,
        notificationText,
        orderDetailsLink)
      await helpers.storeNotification(
        request_row.user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        loggedInUser.id,
        notificationText,
        orderDetailsLink
      );
      return res
        .status(200)
        .json({
          status: 1,
          msg: "Rider assigned successfully.",
          request_row: request_row
        });
    } catch (error) {
      console.error("Error assigning rider:", error.message);
      return res
        .status(200)
        .json({ status: 0, msg: "An error occurred.", error: error.message });
    }
  }

  async getRiderOrders(req, res) {
    try {
      const { token, memType } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "Invalid member type. Only riders can access this endpoint."
          });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }

      const rider = userResponse.user;

      // Fetch requests for which the assigned rider is this user and status is 'accepted'
      const riderOrders = await this.rider.getOrdersByRiderAndStatus({
        riderId: rider.id,
        status: "accepted"
      });

      // Encode the `id` for each order
      const ordersWithEncodedIds = riderOrders.map((order) => {
        const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
        return { ...order, encodedId }; // Add encodedId to each order
      });

      // console.log("Rider Orders with Encoded IDs:", ordersWithEncodedIds);

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
  }
  async getRiderPaymentMethods(req, res) {
    try {
      const { token, memType } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "Invalid member type. Only riders can access this endpoint."
          });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }

      const rider = userResponse.user;

      const states = await helpers.getStatesByCountryId(230);
       const bank_payment_methods = await this.rider.getWithdrawalPamentMethods(rider?.id,'bank-account');
       const paypal_payment_methods = await this.rider.getWithdrawalPamentMethods(rider?.id,'paypal');
      // console.log("Rider Orders with Encoded IDs:", ordersWithEncodedIds);

      // Return the fetched orders with encoded IDs
      return res.status(200).json({
        status: 1,
        states:states,
        bank_payment_methods:bank_payment_methods,
        paypal_payment_methods:paypal_payment_methods,
      });
    } catch (error) {
      console.error("Error in getRiderOrders:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  }
  async AddWithdrawalMethod(req, res) {
    try {
      const { token, memType,bank_name,account_title,account_number,swift_routing_no,country,state,city,paypal_email,payment_method } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "Invalid member type. Only riders can access this endpoint."
          });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }

      const rider = userResponse.user;
      const created_at = helpers.getUtcTimeInSeconds();
      let cleanedData = {};
      if(payment_method=='bank-account'){
        cleanedData = {
          bank_name: typeof bank_name === "string" ? bank_name.trim() : "",
          account_title: typeof account_title === "string" ? account_title.trim() : "",
          account_number: account_number.trim(),
          swift_routing_no: swift_routing_no.trim(),
          country: country.trim(),
          state: state.trim(),
          city: city.trim(),
          mem_id: rider?.id,
          payment_method:payment_method,
          created_at:created_at
        };
      }
      else if(payment_method=='paypal'){
        cleanedData = {
          paypal_email: typeof paypal_email === "string" ? paypal_email.trim() : "",
          mem_id: rider?.id,
          payment_method:payment_method,
          created_at:created_at
        };
      }
      // console.log(validateRequiredFields(cleanedData))
      // Validation for empty fields
      if (!validateRequiredFields(cleanedData)) {
        return res
          .status(200)
          .json({ status: 0, msg: "All fields are required." });
      }
      else{
        const riderOrders = await this.rider.createWithdrawanMethod(cleanedData);
        return res.status(200).json({
          status: 1,
          msg:'Added successfully!'
        });
      }

      return res.status(200).json({
        status: 1,
        states:states
      });
    } catch (error) {
      console.error("Error in getRiderOrders:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  }
async UpdateWithdrawalMethod(req, res) {
    try {
      const { token, memType,bank_name,account_title,account_number,swift_routing_no,country,state,city,paypal_email,payment_method,payment_method_id } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "Invalid member type. Only riders can access this endpoint."
          });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      const rider = userResponse.user;
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }
      if(payment_method_id!==null && payment_method_id!=='' && payment_method_id!==undefined){
          const payment_method_row = await this.rider.getWithdrawalPamentMethodRow(rider?.id,payment_method_id);
          if(payment_method_row?.length===0){
            return res
            .status(200)
            .json({
              status: 0,
              msg: "Invalid payment method to update!"
            });
          }
      }
      else{
        return res
            .status(200)
            .json({
              status: 0,
              msg: "Invalid payment method to update!"
            });
      }

      
      const created_at = helpers.getUtcTimeInSeconds();
      let cleanedData = {};
      if(payment_method=='bank-account'){
        cleanedData = {
          bank_name: typeof bank_name === "string" ? bank_name.trim() : "",
          account_title: typeof account_title === "string" ? account_title.trim() : "",
          account_number: account_number.trim(),
          swift_routing_no: swift_routing_no.trim(),
          country: country.trim(),
          state: state.trim(),
          city: city.trim(),
          mem_id: rider?.id,
          payment_method:payment_method,
          created_at:created_at
        };
      }
      else if(payment_method=='paypal'){
        cleanedData = {
          paypal_email: typeof paypal_email === "string" ? paypal_email.trim() : "",
          mem_id: rider?.id,
          payment_method:payment_method,
          created_at:created_at
        };
      }
      // console.log(validateRequiredFields(cleanedData))
      // Validation for empty fields
      if (!validateRequiredFields(cleanedData)) {
        return res
          .status(200)
          .json({ status: 0, msg: "All fields are required." });
      }
      else{
        const riderOrders = await this.rider.updateWithdrawalMethod(cleanedData,{ id: payment_method_id });
          return res.status(200).json({
            status: 1,
            msg:'Updated successfully!'
          });
      }

      return res.status(200).json({
        status: 1,
        states:states
      });
    } catch (error) {
      console.error("Error in getRiderOrders:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  }
  async DeleteWithdrawalMethod(req, res) {
    try {
      const { token, memType,payment_method_id } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "Invalid member type. Only riders can access this endpoint."
          });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      const rider = userResponse.user;
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }
      if(payment_method_id!==null && payment_method_id!=='' && payment_method_id!==undefined){
          const payment_method_row = await this.rider.getWithdrawalPamentMethodRow(rider?.id,payment_method_id);
          if(payment_method_row?.length===0){
            return res
            .status(200)
            .json({
              status: 0,
              msg: "Invalid payment method to update!"
            });
          }
          const whereCondition = { id: payment_method_id };

          const result = await this.rider.deleteWithdrawalMethod(whereCondition);
          return res.status(200).json({
            status: 1,
            msg:"Deleted successfully!"
          });
      }
      else{
        return res
            .status(200)
            .json({
              status: 0,
              msg: "Invalid payment method to update!"
            });
      }

      
      

      
    } catch (error) {
      console.error("Error in getRiderOrders:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  }
  async getThreeDaysBeforeEarnings(req,res) {
    try{
      const rows=await this.rider.getEarningsBefore3Days();
      console.log(rows)
      for (const row of rows) {
        await this.rider.updateEarningStatusToCleared(row.id);
      }
      console.log("Successfully updated the statuses to cleared.");
    }
    catch (error) {
      console.error("Error in getOrderDetailsByEncodedId:", error);
      return res.status(200).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  }
  async getOrderDetailsByEncodedId(req, res) {
    try {
      const { token } = req.body;
      const { encodedId } = req.params;
      // console.log(encodedId,"encoded id")

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (!encodedId) {
        return res
          .status(200)
          .json({ status: 0, msg: "Encoded ID is required." });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, "rider");

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return validation error response
      }

      const rider = userResponse.user;

      // Decode the encoded ID
      const decodedId = helpers.doDecode(encodedId);
      // console.log("Decoded ID:", decodedId); // Add this line to log the decoded ID

      // Fetch the order using the decoded ID and check if the rider_id matches the logged-in rider's ID
      let order = await this.rider.getOrderDetailsById({
        assignedRiderId: rider.id,
        requestId: decodedId
      });
      // console.log(rider.id, decodedId)
      // console.log("Order from DB:", order); // Add this line to log the order fetched from the database



      if (!order) {
        return res.status(200).json({ status: 0, msg: "Order not found." });
      }

      // Check if the assigned rider matches the logged-in rider
      if (order.assigned_rider !== rider.id) {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "This order is not assigned to the logged-in rider."
          });
      }
      // console.log(order,"order")

      let vehicle = order.selected_vehicle ? await VehicleModel.getVehicleById(order.selected_vehicle) : null;


      const viasCount = await this.rider.countViasBySourceCompleted(order.id);

      // const parcels = await this.rider.getParcelsByQuoteId(order.id); // Assuming order.quote_id is the relevant field
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);
      const reviews = await this.rider.getOrderReviews(order.id);
      // console.log(paidAmount,dueAmount)

      const formattedPaidAmount = helpers.formatAmount(paidAmount);
      const formattedDueAmount = helpers.formatAmount(dueAmount);



      order = {
        ...order,
        formatted_start_date: helpers.formatDateToUK(order?.start_date),
        encodedId: encodedId,
        parcels: parcels,
        vias: vias,
        invoices: invoices,
        viasCount: viasCount,
        formattedPaidAmount,
        formattedDueAmount,
        reviews:reviews,
        dueAmount:dueAmount,
        vehicle
      };
      // Fetch parcels and vias based on the quoteId from the order
      // Assuming order.quote_id is the relevant field

      // Return the order details along with parcels and vias
      return res.status(200).json({
        status: 1,
        msg: "Order details fetched successfully.",
        order // Add vias to the response
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
  updateRequestStatus = async (req, res) => {
    const { token, memType, encodedId, type, via_id } = req.body;
    // console.log(req.body,"encodediddd");return;
    console.log(token)
    try {
      // Validate token and fetch rider details
      const rider = await this.validateTokenAndGetMember(token, memType);
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }
      if (rider?.status===0) {
        return res.status(200).json({ status: 0, msg: rider?.msg});
      }

      // Decode the encoded ID
      const requestId = helpers.doDecode(encodedId);
      if (!requestId) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }
      // console.log(rider);return;
      // Fetch the request by assigned rider and ID
      const request = await this.rider.getRequestById(requestId, rider.user.id);
      if (!request) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }
      const userRow = await this.member.findById(request[0].user_id);
      if (!userRow) {
        return res
          .status(200)
          .json({ status: 0, msg: "Error fetching user" });
      }
      // Handle request update based on type
      if (type?.toLowerCase() === "source") {
        // Update picked time for source
        const pickedTime = helpers.getUtcTimeInSeconds();
        const updatedRequest = await this.rider.updateSourceRequestStatus(
          requestId,
          {
            is_picked: 1,
            picked_time: pickedTime
          }
        );

        if (!updatedRequest) {
          return res
            .status(500)
            .json({ status: 0, msg: "Error updating request status." });
        }
      } else if (type?.toLowerCase() === "via") {
        if (!via_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Via ID not provided." });
        }

        const pickedViaTime = helpers.getUtcTimeInSeconds();

        // Fetch the via by request_id and via_id
        const via = await this.rider.getViaByRequestAndId(requestId, via_id);
        if (!via) {
          return res.status(200).json({ status: 0, msg: "Via not found." });
        }
        // console.log(via);return;
        // Update the via's is_picked and picked_time
        const updatedVia = await this.rider.updateViaStatus(via_id, {
          is_picked: 1,
          picked_time: pickedViaTime
        });

        if (!updatedVia) {
          return res
            .status(500)
            .json({ status: 0, msg: "Error updating via status." });
        }
      } else if (type?.toLowerCase() === "destination") {
        // Replicating source logic for destination update
        const deliveredTime = helpers.getUtcTimeInSeconds();

        // Update picked time for destination (you can adjust this logic depending on your database schema for destination)
        const updatedDestinationRequest =
          await this.rider.updateDestinationRequestStatus(requestId, {
            is_delivered: 1,
            delivered_time: deliveredTime
          });
        // console.log("deliveredTime:", deliveredTime);

        if (!updatedDestinationRequest) {
          return res
            .status(200)
            .json({ status: 0, msg: "Error updating destination status." });
        }
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid type specified." });
      }

      // Fetch updated order details
      const riderId = rider.id || rider.user.id;
      const order = await this.rider.getOrderDetailsById({
        assignedRiderId: riderId,
        requestId: requestId
      });
      // console.log("Order retrieved:", order);


      if (!order || order.assigned_rider !== riderId) {
        return res
          .status(200)
          .json({ status: 0, msg: "Order not assigned to this rider." });
      }

      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      // console.log("viasCount:", viasCount);

      // Fetch parcels and vias
      // const parcels = await this.rider.getParcelsByQuoteId(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);

      const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);

      const formattedPaidAmount = helpers.formatAmount(paidAmount);
      const formattedDueAmount = helpers.formatAmount(dueAmount);

      const completeOrder = {
        ...order,
        encodedId,
        vias,
        parcels,
        invoices,
        viasCount,
        formattedPaidAmount,
        formattedDueAmount
      };

      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;


      const notificationText = `Your request #${order.id} has been accepted by a rider.`;
      await helpers.storeNotification(
        order.user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        rider.user.id, // Use rider's ID as the sender
        notificationText,
        orderDetailsLink
      );

      return res.status(200).json({
        status: 1,
        order: completeOrder
      });
    } catch (error) {
      console.error("Error in updateRequestStatus:", error);
      return res.status(200).json({ status: 0, msg: "Server error." });
    }
  };

  //   router.post('/mark-as-completed', async (req, res) => {
  markAsCompleted = async (req, res) => {
    const {
      type,
      token,
      encodedId,
      handball_charges,
      waiting_charges,
      via_id
    } = req.body;
    // console.log(req.body, "req.body");return;

    try {
      // Step 1: Validate token and fetch rider
      const rider = await this.validateTokenAndGetMember(token, "rider");
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }

      // Decode the encoded ID
      const decodedRequestId = helpers.doDecode(encodedId);
      if (!decodedRequestId) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }

      // Fetch the request by assigned rider and ID
      const request = await this.rider.getRequestById(
        decodedRequestId,
        rider.user.id
      );
      if (!request) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }

      const formattedHandballCharges = helpers.formatAmount(handball_charges);
    const formattedWaitingCharges = helpers.formatAmount(waiting_charges);

      // Handle source type logic
      if (type === "source") {
        // Step 2: Create invoice entries for source charges
        if (formattedHandballCharges) {
          const handballInvoice = await this.rider.createInvoiceEntry(
            decodedRequestId,
            formattedHandballCharges,
            "handball",
            1,
            type,
            null,
           'charges'

          );
          if (!handballInvoice) {
            return res
              .status(200)
              .json({ status: 0, msg: "Error creating handball invoice" });
          }
        }

        if (formattedWaitingCharges) {
          const waitingInvoice = await this.rider.createInvoiceEntry(
            decodedRequestId,
            formattedWaitingCharges,
            "waiting",
            1,
            type,
            null,
           'charges'
          );
          if (!waitingInvoice) {
            return res
              .status(200)
              .json({ status: 0, msg: "Error creating waiting invoice" });
          }
        }

        // Step 3: Update the source_completed flag in the request_quote table
        const updatedRequestQuote =
          await this.rider.updateRequestQuoteSourceCompleted(
            decodedRequestId,
            1
          );
        if (!updatedRequestQuote) {
          return res
            .status(200)
            .json({
              status: 0,
              msg: "Error updating source completion status"
            });
        }
      } else if (type === "via") {
        // Handle via type logic
        if (!via_id) {
          return res
            .status(200)
            .json({ status: 0, msg: "Via ID is required for type 'via'." });
        }
        // console.log("via_id:", via_id);
        // console.log("decodedRequestId:", decodedRequestId);

        // Fetch the via row for the provided via_id
        const viaRow = await this.rider.getViaByIdAndRequestId(
          via_id,
          decodedRequestId
        );
        if (!viaRow) {
          return res
            .status(200)
            .json({ status: 0, msg: "Via not found for the given ID." });
        }
        // console.log("viaRow:", viaRow);return;

        // Create invoice entries for via charges
        if (formattedHandballCharges) {
          const handballInvoice = await this.rider.createInvoiceEntry(
            decodedRequestId,
            formattedHandballCharges,
            "handball",
            1,
            type,
            via_id,
           'charges'
          );
          if (!handballInvoice) {
            return res
              .status(200)
              .json({
                status: 0,
                msg: "Error creating handball invoice for via"
              });
          }
        }

        if (formattedWaitingCharges) {
          const waitingInvoice = await this.rider.createInvoiceEntry(
            decodedRequestId,
            formattedWaitingCharges,
            "waiting",
            1,
            type,
            via_id,
           'charges'
          );
          if (!waitingInvoice) {
            return res
              .status(200)
              .json({
                status: 0,
                msg: "Error creating waiting invoice for via"
              });
          }
        }

        // Update the source_completed column in the via row
        const updatedVia = await this.rider.updateViaSourceCompleted(via_id, 1);
        if (!updatedVia) {
          return res
            .status(200)
            .json({ status: 0, msg: "Error updating via completion status" });
        }

        const updatedRequestTime = await this.rider.updateRequestQuoteTime(
          decodedRequestId
        );
        if (!updatedRequestTime) {
          return res
            .status(200)
            .json({
              status: 0,
              msg: "Error updating updated_time in request_quote"
            });
        }
        console.log("Creating invoice for destination charges");
      } else if (type === "destination") {
        // Handle destination type logic (similar to source)
        // Step 2: Create invoice entries for destination charges
        if (formattedHandballCharges) {
          // console.log("Handball Charges:", handball_charges);

          const handballInvoice = await this.rider.createInvoiceEntry(
            decodedRequestId,
            formattedHandballCharges,
            "handball",
            1,
            type,
            null,
           'charges'
          );
          if (!handballInvoice) {
            return res
              .status(200)
              .json({
                status: 0,
                msg: "Error creating handball invoice for destination"
              });
          }
        }

        if (formattedWaitingCharges) {
          // console.log("Waiting Charges:", waiting_charges);

          const waitingInvoice = await this.rider.createInvoiceEntry(
            decodedRequestId,
            formattedWaitingCharges,
            "waiting",
            1,
            type,
            null,
           'charges'
          );
          if (!waitingInvoice) {
            return res
              .status(200)
              .json({
                status: 0,
                msg: "Error creating waiting invoice for destination"
              });
          }
        }

        // Step 3: Update the destination_completed flag in the request_quote table
        const updatedRequestQuote =
          await this.rider.updateRequestQuoteDestinationCompleted(
            decodedRequestId,
            1
          );
        if (!updatedRequestQuote) {
          return res
            .status(200)
            .json({
              status: 0,
              msg: "Error updating destination completion status"
            });
        }
      } else {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid type provided." });
      }

      // Step 4: Fetch the updated order details
      const order = await this.rider.getOrderDetailsById({
        assignedRiderId: rider.user.id,
        requestId: decodedRequestId
      });

      if (!order) {
        return res.status(200).json({ status: 0, msg: "Order not found." });
      }
      const userRow = await this.member.findById(order.user_id);
      if (!userRow) {
        return res
          .status(200)
          .json({ status: 0, msg: "Error fetching user" });
      }
      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      // console.log("viasCount:", viasCount);

      // const parcels = await this.rider.getParcelsByQuoteId(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(
        decodedRequestId
      );

      if (!invoices) {
        return res
          .status(200)
          .json({ status: 0, msg: "Error fetching invoices" });
      }

      const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);

      const formattedPaidAmount = helpers.formatAmount(paidAmount);
      const formattedDueAmount = helpers.formatAmount(dueAmount);

      const formattedOrder = {
        ...order,
        encodedId,
        vias,
        invoices,
        parcels,
        invoices,
        viasCount,
        formattedPaidAmount,
        formattedDueAmount,
        dueAmount:dueAmount
      };
      // console.log(formattedOrder)

      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;


      const notificationText = `Your request #${order.id} has been marked as completed.`;
      
      await helpers.storeNotification(
        order.user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        rider.user.id,
        notificationText,
        orderDetailsLink
      );

      // Step 5: Respond with the updated order
      res
        .status(200)
        .json({
          status: 1,
          order: formattedOrder,
          msg: "Request marked as completed"
        });
    } catch (error) {
      console.error("Error in markAsCompleted:", error);
      res.status(500).json({ status: 0, msg: "Server error" });
    }
  };

  getInvoiceDetails = async (req, res) => {
    const { requestId } = req.query;

    if (!requestId) {
      return res
        .status(200)
        .json({ status: 0, msg: "Request ID is required." });
    }

    try {
      // Fetch invoice details using the RiderModel method
      const invoices = await this.rider.getInvoicesDetailsByRequestId(
        requestId
      );

      if (!invoices || invoices.length === 0) {
        return res
          .status(200)
          .json({
            status: 0,
            msg: "No invoices found for the provided request ID."
          });
      }

      return res.status(200).json({ status: 1, invoices });
    } catch (error) {
      console.error("Error in getInvoiceDetails:", error);
      return res.status(500).json({ status: 0, msg: "Server error." });
    }
  };

  // Test API for storeNotification
  // router.post('/api/test-notification', async (req, res) => {
  testNotification = async (req, res) => {
    try {
      // Static test data
      const user_id = 1; // Replace with actual user ID for testing
      const mem_type = "user"; // Replace with actual member type
      const sender = 1; // Replace with actual sender ID
      const text = "This is a test notification";

      // Call the storeNotification function
      const result = await helpers.storeNotification(
        user_id,
        mem_type,
        sender,
        text
      );

      // Return a success response
      res.status(200).json({
        status: 1,
        message: "Test notification stored and emitted successfully",
        result: result
      });
    } catch (error) {
      console.error("Error in test notification API:", error);
      res.status(500).json({
        status: 0,
        message: "Failed to store and emit test notification",
        error: error.message
      });
    }
  };

updateRequestStatusToCompleted = async (req, res) => {
    try {
        const { id, token } = req.body; // ID of the request to update
        // console.log("id:",id);return;

        // Check if ID is provided
        if (!id) {
            return res.status(200).json({ status: 0, msg: 'Request ID is required' });
        }

        // Step 1: Validate token and fetch rider
      const rider = await this.validateTokenAndGetMember(token, "rider");
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }
      // console.log("rider:",rider)

      const encodedId = helpers.doEncode(String(id)); // Convert order.id to a string


      // Decode the encoded ID
      const decodedRequestId = helpers.doDecode(encodedId);
      if (!decodedRequestId) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }

      // Fetch the request by assigned rider and ID
      const request = await this.rider.getRequestById(
        decodedRequestId,
        rider.user.id
      );
      if (!request) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }
      const userRow = await this.member.findById(request[0].user_id);
      if (!userRow) {
        return res
          .status(200)
          .json({ status: 0, msg: "Error fetching user" });
      }
      // console.log("request:",request);return;

        // Update the status using the model
        const updatedRequest = await RequestQuoteModel.updateRequestStatus(id, 'completed');
        // console.log("updatedRequest:",updatedRequest)

        if (!updatedRequest) {
            return res.status(200).json({ status: 0, msg: 'Request not found' });
        }

        // Step 2: Calculate earnings and insert into the earnings table
        const totalDistance = request[0].total_distance || 0;
        const riderPrice = request[0].rider_price || 0; // Assuming `rider_price` is part of the request data
        const formattedRiderPrice = helpers.formatAmount(riderPrice);

        const amount = totalDistance * formattedRiderPrice;
        const created_time = helpers.getUtcTimeInSeconds()

        const formattedAmount = helpers.formatAmount(amount);


    if (formattedAmount > 0) {
      const earningsData = {
        user_id: rider.user.id,
        amount: formattedAmount,
        type: "credit",
        status: "pending",
        created_time: created_time, // UTC time in seconds
      };
      // console.log(rider.user.id,amount,created_time);return;

      const insertedEarnings = await helpers.insertEarnings(earningsData);
      // console.log("insertedEarnings:",insertedEarnings);return;

      if (!insertedEarnings) {
        return res
          .status(200)
          .json({ status: 0, msg: "Failed to insert earnings data." });
      }
    }

        const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

        const notificationText = `Your request #${id} has been completed.`;
      await helpers.storeNotification(
        request[0].user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        rider.user.id,
        notificationText,
        orderDetailsLink // Pass the link

      );

        return res.status(200).json({
            status: 1,
            msg: "Status updated to completed and earnings added.",
            data: updatedRequest,
        });
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(200).json({
          status: 0, msg: 'An error occurred while updating the status',
        });
    }
}

async getRiderDashboardOrders(req, res) {
  try {
    const { token, memType } = req.body;

    // Validate token and memType
    if (!token) {
      return res.status(200).json({ status: 0, msg: "Token is required." });
    }

    if (memType !== "rider") { // Ensure the memType is 'rider'
      return res.status(200).json({ status: 0, msg: "Invalid member type." });
    }

    // Validate the token and get the rider details
    const userResponse = await this.validateTokenAndGetMember(token, memType);

    if (userResponse.status === 0) {
      return res.status(200).json(userResponse); // Return validation error response
    }

    // Extract the logged-in rider ID from the token validation response
    const member = userResponse.user;
    const riderId = member.id; // Assuming the `id` field contains the rider's unique ID

    // Call the model function to get the completed orders
    const completedOrders = await this.rider.getCompletedOrdersByRider(riderId);
    console.log(completedOrders)
    const ordersWithEncodedIds = completedOrders.map((order) => {
            const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
            return { ...order, encodedId }; // Add encodedId to each order
          });

    // Call the model function to get the total orders with status 'completed' or 'accepted'
    const totalOrders = await this.rider.getTotalOrdersByStatus(riderId);

    // Call the model function to get the total number of completed orders
    const totalCompletedOrders = await this.rider.getTotalCompletedOrders(riderId);
    console.log(completedOrders,totalOrders,totalCompletedOrders)

    // Return the response with the fetched orders and total order counts
    return res.status(200).json({
      status: 1,
      msg: "Rider dashboard data fetched successfully.",
      ordersWithEncodedIds,          // Last 3 completed orders
      totalOrders,              // Total number of 'completed' or 'accepted' orders
      totalCompletedOrders,     // Total number of 'completed' orders
    });
  } catch (error) {
    console.error("Error fetching rider dashboard orders:", error.message);
    return res.status(200).json({ status: 0, msg: "Internal Server Error" });
  }
}

async getRiderEarnings(req, res) {
  try {
    const { token, memType } = req.body;
    // console.log(req.body,"req.body")

    // Validate token and memType
    if (!token) {
      return res.status(200).json({ status: 0, msg: "Token is required." });
    }

    if (memType !== "rider") { // Ensure the memType is 'rider'
      return res.status(200).json({ status: 0, msg: "Invalid member type." });
    }

    // Validate the token and get the rider details
    const userResponse = await this.validateTokenAndGetMember(token, memType);

    if (userResponse.status === 0) {
      return res.status(200).json(userResponse); // Return validation error response
    }

    // Extract the logged-in rider ID from the token validation response
    const riderId = userResponse.user.id;

    // Now, call the model's getRiderEarnings function to fetch the earnings
    const earningsData = await this.rider.getRiderEarnings(riderId);
    console.log("net income:",earningsData.netIncome,"available balance:",earningsData.availableBalance,earningsData.totalWithdrawn)

    if (!earningsData) {
      return res.status(200).json({ status: 0, msg: "No earnings found for this rider." });
    }

    const formattedNetIncome = helpers.formatAmount(earningsData.netIncome);
    const formattedAvailableBalance = helpers.formatAmount(earningsData.availableBalance);
    const totalWithdrawn = helpers.formatAmount(earningsData.totalWithdrawn);
    // const formattedEarnings = helpers.formatAmount(earningsData.earnings);


    const bank_payment_methods = await this.rider.getWithdrawalPamentMethods(riderId,'bank-account');
    const paypal_payment_methods = await this.rider.getWithdrawalPamentMethods(riderId,'paypal');

    const formattedEarnings = earningsData.earnings.map(earning => ({
      ...earning,
      amount: helpers.formatAmount(earning.amount), // Assuming each earning has an `amount` field
    }));



    // Return earnings data, net income, and available balance
    return res.status(200).json({
      status: 1,
      netIncome: formattedNetIncome,
      availableBalance: formattedAvailableBalance,
      earnings: formattedEarnings,
      totalWithdrawn:totalWithdrawn,
      bank_payment_methods:bank_payment_methods,
      paypal_payment_methods:paypal_payment_methods
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return res.status(200).json({ status: 0, msg: "An error occurred while fetching earnings" });
  }
}
async saveWithDrawalRequest(req, res) {
  try {
    const { token, memType, payment_method, account_details, paypal_details } = req.body;

    // Validate token and memType
    if (!token) {
      return res.status(200).json({ status: 0, msg: "Token is required." });
    }

    if (memType !== "rider") {
      return res.status(200).json({ status: 0, msg: "Invalid member type." });
    }

    // Validate the token and get the rider details
    const userResponse = await this.validateTokenAndGetMember(token, memType);

    if (userResponse.status === 0) {
      return res.status(200).json(userResponse);
    }

    const riderId = userResponse.user.id;

    // Validate payment method and required details
    if (payment_method === "bank-account" && !account_details) {
      return res.status(200).json({ status: 0, msg: "Bank details are required." });
    }

    if (payment_method === "paypal" && !paypal_details) {
      return res.status(200).json({ status: 0, msg: "PayPal email is required!" });
    }

    // Get cleared earnings for the rider
    const clearedEarnings = await this.rider.getClearedEarnings(riderId);
    const availableBalance = clearedEarnings.reduce((sum, earning) => sum + parseFloat(earning.amount), 0);

    // Validate available balance
    if (availableBalance <= 0) {
      return res.status(200).json({ status: 0, msg: "Insufficient balance for withdrawal." });
    }

    const formattedBalance = helpers.formatAmount(availableBalance);

    // Create debit entry in the earnings table
    const created_time = helpers.getUtcTimeInSeconds();
    const debitEntry = await helpers.insertEarnings({
      user_id: riderId,
      amount: formattedBalance, // Store available balance
      type: "debit", // Debit entry
      status: "cleared", // Cleared status
      created_time: created_time,
    });

    if (!debitEntry) {
      return res.status(200).json({ status: 0, msg: "Failed to create debit entry." });
    }

    const earningId = debitEntry[0].insertId; // Assuming this is how `insertId` is accessed

    // Create an entry in the withdraw_requests table
    const created_at = helpers.getUtcTimeInSeconds();
    const updated_at = helpers.getUtcTimeInSeconds();
    const result = await this.rider.createWithdrawalRequest({
      riderId,
      earning_id: earningId, // Link to the debit entry
      amount: formattedBalance, // Withdrawal amount
      status: "pending", // Withdrawal request is pending
      payment_method,
      account_details,
      paypal_details,
      created_at,
      updated_at,
    });

    if (!result.insertId) {
      return res.status(200).json({ status: 0, msg: "Failed to create withdrawal request." });
    }

    return res.status(200).json({ status: 1, msg: "Withdrawal request submitted successfully." });
  } catch (error) {
    console.error("Error in saveWithDrawalRequest:", error);
    return res.status(500).json({ status: 0, msg: "Internal server error." });
  }
}

async getRiderDocumentsApi(req, res) {
  try {
    const { token, memType } = req.body;
    console.log("Received Token:", token);
    console.log("Received Member Type:", memType);


    // Validate token and memType
    if (!token) {
      return res.status(200).json({ status: 0, msg: "Token is required." });
    }

    if (memType !== "rider") {
      return res.status(200).json({ status: 0, msg: "Invalid member type." });
    }

    // Validate the token and get the rider details
    const userResponse = await this.validateTokenAndGetMember(token, memType);
    console.log("User Response:", userResponse);


    if (userResponse.status === 0) {
      return res.status(200).json(userResponse);
    }

    const riderId = userResponse.user.id;
    console.log("Fetching documents for Rider ID:", riderId);

      // Fetch the documents for the given rider_id
      const documents = await RiderModel.getDocuments(riderId);
      console.log("Fetched Documents:", documents);


      // If no documents are found
      if (documents.length === 0) {
          return res.status(200).json({ message: 'No documents found for this rider.' });
      }

      // Return the list of documents as JSON
      res.status(200).json({ documents });

  } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(200).json({ error: 'Failed to fetch documents' });
  }
}

async uploadRiderDocument  (req, res)  {
  try {
    const { req_id, memType, token } = req.body;
    const riderDocument = req.files && req.files["rider_document"] ? req.files["rider_document"][0].filename : '';
    console.log("req.body", req.body);  // Log body data
console.log(token,req_id,riderDocument,'all data')


    // Validate request
    if (!token || !req_id || !riderDocument) {
      return res.status(200).json({ status: 0, msg: "Missing required fields." });
    }

    // Validate token and get user
    const userResponse = await this.validateTokenAndGetMember(token, memType);
    if (userResponse.status === 0) {
      return res.status(200).json(userResponse);
    }

    const riderId = userResponse.user.id;

    // Check if the document belongs to the logged-in user

    const existingDoc = await RiderModel.getDocumentByIdAndRiderId(req_id,riderId);
    console.log("existingDoc:",existingDoc)

    if (!existingDoc.length) {
      return res.status(200).json({ status: 0, msg: "Unauthorized access." });
    }

    // Encrypt filename and move file

    const encryptedFileName = riderDocument

    // Update document record
    await RiderModel.updateDocumentNameAndStatus(encryptedFileName, req_id)
    console.log(    await RiderModel.updateDocumentNameAndStatus(encryptedFileName, req_id)
  )
    

    res.status(200).json({ status: 1, msg: "File uploaded successfully.", encryptedFileName });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(200).json({ status: 0, msg: "Internal server error." });
  }
};

// router.post("/delete-rider-document", async (req, res) => {
  async deleteRiderDocument(req, res) {
    try {
      const { req_id, token, memType } = req.body;
  
      if (!req_id || !token || !memType) {
        return res.status(200).json({ status: 0, msg: "Invalid request data" });
      }
  
      // Validate user
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }
  
      const riderId = userResponse.user.id;
  
      // Fetch the document based on req_id AND riderId
      const documentExists = await RiderModel.getDocumentByIdAndRiderId(req_id, riderId);
  
      if (!documentExists) {
        return res.status(200).json({ status: 0, msg: "Document not found or does not belong to the rider" });
      }
  
      // Delete the document
      await RiderModel.deleteDocument(req_id, riderId);
  
      return res.json({ status: 1, msg: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      return res.status(200).json({ status: 0, msg: "Server error" });
    }
  }
  
  







}

module.exports = RiderController;
