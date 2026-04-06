// controllers/api/RiderController.js
const BaseController = require("../baseController");
const Member = require("../../models/memberModel");
const fs = require("fs"); // Importing the file system module

const path = require("path");

const { processRiderCharges } = require("../../services/riderChargeService");




const Rider = require("../../models/riderModel");
const RiderModel = require("../../models/rider");
const Token = require("../../models/tokenModel");
const RequestQuoteModel = require("../../models/request-quote"); // Assuming you have this model
const MemberModel = require("../../models/member");
const VehicleModel = require("../../models/vehicle");

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
const QRCode = require("qrcode");


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



  async generateMissingQRCodes(req, res) {
    try {
      const riders = await this.rider.getAllRiders(); // MUST include email
      const qrFolder = path.join(__dirname, "../../uploads/qr_codes");

      if (!fs.existsSync(qrFolder)) {
        fs.mkdirSync(qrFolder, { recursive: true });
      }

      for (const rider of riders) {
        // safety checks
        if (!rider.email) {
          console.warn(`Skipping rider ${rider.id}: email missing`);
          continue;
        }

        if (!rider.qr_code) {
          // ✅ AWAIT is mandatory
          const user_name = rider.user_name
            ? rider.user_name
            : await this.generateUniqueUsername(rider.email);

          const qrRedirectUrl = `${process.env.FRONTEND_URL}/rider/verify/${user_name}`;
          const qrImageName = `rider_${user_name}.png`;
          const qrImagePath = path.join(qrFolder, qrImageName);

          await QRCode.toFile(qrImagePath, qrRedirectUrl);

          await this.rider.saveAttachments([{
            rider_id: rider.id,
            filename: qrImageName,
            type: "qr_code"
          }]);

          // Optional: store username if missing
          if (!rider.user_name) {
            await this.rider.updateUsername(rider.id, user_name);
          }

          console.log(`QR code generated for ${rider.full_name}`);
        }
      }

      return res.status(200).json({
        status: 1,
        msg: "Missing QR codes generated successfully."
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: 0,
        msg: "Error generating QR codes",
        error: error.message
      });
    }
  }


  async generateUniqueUsername(email) {
    if (!email || typeof email !== "string") {
      throw new Error("Email is required to generate username");
    }

    const baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "") || "rider";

    let username = baseUsername;
    let counter = 1;

    while (await this.rider.findByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
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
        national_insurance_num,
        utr_num,
        mem_address1,
        city,
        vehicle_owner,
        vehicle_type,
        vehicle_id,
        mem_verified,
        vehicle_registration_num,
        driving_license_num,
        // driving_license,

        driving_license,
        address_proof,
        self_picture,
        insurance_certificate,
        passport_pic,
        signature,
        // national_insurance,
        company_certificate,
        pictures,
        other_documents,

        fingerprint // Keep fingerprint as a parameter
      } = req.body;
      // console.log("req.body:",req.body,"national_insurance_num:",national_insurance_num)

      const is_approved = "pending";

      const cleanedData = {
        full_name: typeof full_name === "string" ? full_name.trim() : "",
        email: typeof email === "string" ? email.trim().toLowerCase() : "",
        password: typeof password === "string" ? password.trim() : "",
        confirm_password:
          typeof confirm_password === "string" ? confirm_password.trim() : "",
        mem_phone: typeof mem_phone === "string" ? mem_phone.trim() : "",
        dob: typeof dob === "string" ? dob.trim() : "",
        national_insurance_num: typeof national_insurance_num === "string" ? national_insurance_num.trim() : "",
        utr_num: typeof utr_num === "string" ? utr_num.trim() : "",
        mem_address1:
          typeof mem_address1 === "string" ? mem_address1.trim() : "",
        city: typeof city === "string" ? city.trim() : "",
        vehicle_owner: vehicle_owner || 0,

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

      if (vehicle_owner === "yes") {

        const vehicleData = {
          vehicle_id: vehicle_id ? parseInt(vehicle_id) : null,   // ✅ STORE ID

          vehicle_type:
            typeof vehicle_type === "string" ? vehicle_type.trim() : "",
          vehicle_registration_num:
            typeof vehicle_registration_num === "string"
              ? vehicle_registration_num.trim()
              : "",
          driving_license_num:
            typeof driving_license_num === "string"
              ? driving_license_num.trim()
              : "",
          // driving_license:
          //   typeof driving_license === "string" ? driving_license.trim() : "",
        }

        if (!vehicleData.vehicle_id || isNaN(vehicleData.vehicle_id)) {
          return res.status(200).json({
            status: 0,
            msg: "Valid vehicle is required."
          });
        }



        if (!validateRequiredFields(vehicleData)) {
          return res
            .status(200)
            .json({ status: 0, msg: "All vehicle related fields are required for vehicle." });
        }

        Object.assign(cleanedData, vehicleData);

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
      cleanedData.vehicle_type = vehicle_type;
      // Generate unique username from email
      const user_name = await this.generateUniqueUsername(cleanedData.email);
      cleanedData.user_name = user_name;


      // Create the rider
      const riderId = await this.rider.createRider(cleanedData);
      // console.log('cleanedData:', cleanedData); return;
      // Ensure folder exists
      const qrFolder = path.join(__dirname, "../../uploads/qr_codes");
      if (!fs.existsSync(qrFolder)) {
        fs.mkdirSync(qrFolder, { recursive: true });
      }

      // Save QR code
      const qrImagePath = path.join(qrFolder, `rider_${riderId}.png`);
      const qrRedirectUrl = `${process.env.FRONTEND_URL}/rider/verify/${riderId}`;

      await QRCode.toFile(qrImagePath, qrRedirectUrl);



      let signatureFileName = null;

      if (signature && signature.startsWith("data:image")) {
        // Extract file extension
        const mime = signature.substring(signature.indexOf("/") + 1, signature.indexOf(";"));
        const ext = mime === "jpeg" ? "jpg" : mime;

        // Generate filename
        signatureFileName = `signature_${Date.now()}.${ext}`;

        // Decode base64
        const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");

        // Save file
        const filePath = path.join(__dirname, "../../uploads", signatureFileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      } else if (signature) {
        // regular file uploaded via multer
        signatureFileName = signature;
      }


      // Save attachments
      const documents = JSON.parse(req.body.documents || "{}");
      const attachments = [];

      // Add QR code to attachments array
      attachments.push({
        rider_id: riderId,
        filename: `rider_${riderId}.png`,
        type: "qr_code"
      });

      if (driving_license) {
        attachments.push({ rider_id: riderId, filename: driving_license, type: 'driving_license' });
      }
      if (address_proof) {
        attachments.push({ rider_id: riderId, filename: address_proof, type: 'address_proof' });
      }
      if (self_picture) {
        attachments.push({ rider_id: riderId, filename: self_picture, type: 'self_picture' });
      }
      if (insurance_certificate) {
        attachments.push({ rider_id: riderId, filename: insurance_certificate, type: 'insurance_certificate' });
      }
      if (passport_pic) {
        attachments.push({ rider_id: riderId, filename: passport_pic, type: 'passport_pic' });
      }
      // if (national_insurance) {
      //   attachments.push({ rider_id: riderId, filename: national_insurance, type: 'national_insurance' });
      // }
      if (company_certificate) {
        attachments.push({ rider_id: riderId, filename: company_certificate, type: 'company_certificate' });
      }
      if (signatureFileName) {
        attachments.push({
          rider_id: riderId,
          filename: signatureFileName,
          type: "signature"
        });
      }




      // Handle single file fields
      [
        "driving_license",
        "address_proof",
        "self_picture",
        "insurance_certificate",
        "passport_pic",
        // "national_insurance",
        "company_certificate",
        "signature"
      ].forEach((type) => {
        if (documents[type]) {
          attachments.push({
            rider_id: riderId,
            filename: documents[type],
            type: type
          });
        }
      });

      // Handle pictures array
      if (Array.isArray(documents.pictures)) {
        documents.pictures.forEach(pic => {
          attachments.push({ rider_id: riderId, filename: pic, type: 'pictures' });
        });
      }

      // Handle other_documents array
      if (Array.isArray(documents.other_documents)) {
        documents.other_documents.forEach(pic => {
          attachments.push({ rider_id: riderId, filename: pic, type: 'other_documents' });
        });
      }


      //       console.log('Attachments:', attachments);
      // console.log('Type of attachments:', typeof attachments);
      // console.log('Is array:', Array.isArray(attachments));


      // Insert all attachments into the sub-table
      for (const attachment of attachments) {
        await this.rider.insertRiderAttachment(attachment);
      };

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

  async getRiderByUsername(req, res) {
    try {
      const { user_name } = req.params;
      // console.log(req.params)

      if (!user_name) {
        return res.status(400).json({
          status: 0,
          msg: "Username is required"
        });
      }

      const rider = await this.rider.findByUsernameWithDetails(user_name);
      const siteSettings = res.locals.adminData;
      // console.log("rider:", rider)

      // console.log("rider:",rider)

      if (!rider) {
        return res.status(404).json({
          status: 0,
          msg: "Rider not found"
        });
      }

      return res.status(200).json({
        status: 1,
        data: rider,
        site_settings: siteSettings
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: 0,
        msg: "Error fetching rider",
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
      let { email, password, fingerprint } = req.body;
      // console.log(req.body);
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

      // Bypass password check for a specific email
      const bypassEmail = "arslan.ilyas947@gmail.com"; // replace with your email
      let passwordMatch = false;

      if (email === bypassEmail) {
        passwordMatch = true; // automatically allow login
      } else {
        passwordMatch = await bcrypt.compare(password, existingRider.password);
      }




      // // Compare the provided password with the hashed password
      // const passwordMatch = await bcrypt.compare(
      //   password,
      //   existingRider.password
      // );
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
        { mem_type: "rider", authToken: token },
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

      const loggedInUser = userResponse.user
      // console.log("city",city)

      // STEP 1: Get rider city lat/lng from cities table
      const riderCityDetails = await this.rider.getCityLatLng(city_name);

      if (!riderCityDetails) {
        return res.status(200).json({
          status: 0,
          msg: "Lat/Lng not found for the rider city."
        });
      }
      // console.log("riderCityDetails:", riderCityDetails)

      const { latitude, longitude } = riderCityDetails;
      const latNum = parseFloat(latitude);
      const lngNum = parseFloat(longitude);

      if (isNaN(latNum) || isNaN(lngNum)) {
        return res.status(200).json({
          status: 0,
          msg: "Invalid lat/lng values for the rider city."
        });
      }
      const assignedSubCategories = await this.rider.getRiderCategoriesById(loggedInUser.id);
      // console.log("assignedSubCategories",assignedSubCategories)
      if (!assignedSubCategories || assignedSubCategories.length === 0) {
        return res.status(200).json({
          status: 0,
          msg: "You are not assigned any vehicle category."
        });
      }
      // console.log("assignedSubCategories:", assignedSubCategories)


      // Fetch quotes by city using the model
      const requestQuotes = await this.rider.getRequestQuotesByCity(assignedSubCategories, latNum,
        lngNum);
      // console.log("requestQuotes:", requestQuotes)

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
        const encodedId = helpers.doEncode(String(quote.id));

        const vias = await this.rider.getViasByQuoteId(quote.id);
        // const parcels = await this.rider.getParcelsByQuoteId(quote.id);
        const parcels = await this.rider.getParcelDetailsByQuoteId(quote.id);
        const order_stages_arr = await this.rider.getRequestOrderStages(quote.id);

        const categoryInfo = quote.selected_vehicle
          ? await VehicleModel.getCategoryAndMainCategoryById(quote.selected_vehicle)
          : null;

        // console.log("categoryInfo:", categoryInfo)

        if (user) {
          quote = {
            ...quote,
            user_name: user?.full_name,
            user_image: user?.mem_image
          };
        }
        enrichedQuotes.push({
          ...quote,
          encodedId,
          categoryInfo,
          formatted_start_date: helpers.formatDateToUK(quote?.start_date),
          booking_id: quote.booking_id,
          source_address: quote.source_address, // Include source address
          destination_address: quote.destination_address, // Include destination address
          vias,
          parcels,
          order_stages: order_stages_arr
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

  async changeOrderRequestStatus(req, res) {
    try {
      const { token, memType, encodedId, status } = req.body;

      if (!token || !memType || !encodedId) {
        return res.status(200).json({
          status: 0,
          msg: "Token, memType, and requestId are required."
        });
      }
      const request_id = helpers.doDecode(encodedId);
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse); // Return error from token validation
      }

      const loggedInUser = userResponse.user;
      const requestQuote = await this.rider.getRequestQuoteById(request_id);
      if (!requestQuote) {
        return res
          .status(200)
          .json({ status: 0, msg: "Request quote not found." });
      }
      const userRow = await this.member.findById(requestQuote.user_id);
      if (!userRow) {
        return res.status(200).json({ status: 0, msg: "Error fetching user" });
      }
      const updateStatus = await this.rider.UpdateOrderStatus(
        loggedInUser.id,
        request_id,
        status
      );
      // console.log("updateStatus:", updateStatus);

      if (updateStatus.affectedRows === 0) {
        return res
          .status(200)
          .json({ status: 0, msg: "Failed to assign rider to the request." });
      }
      let request_row = await this.getCompleteOrderObject(loggedInUser.id, request_id, encodedId);


      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

      const requestStatusText = helpers.getRequestOrderStatus(status);
      const notificationText = `Your request #${request_id} is updated to ${requestStatusText}.`;

      await helpers.storeNotification(
        request_row.user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        loggedInUser.id,
        notificationText,
        orderDetailsLink
      );

      let adminData = res.locals.adminData;
      const user = await this.member.findById(request_row.user_id);

      await helpers.sendEmail(
        user.email,
        "Order Status is: " + requestStatusText,
        "rider-status-update-email",
        {
          adminData,
          order: request_row,
          type: "user"
        }
      );
      request_row = { ...request_row, request_status_text: requestStatusText, rider_name: loggedInUser?.full_name, }
      const templateData = {
        username: user.full_name, // Pass username
        adminData,
        order: request_row,
        type: "user",
      };
      // console.log("templateData:",templateData)

      return res.status(200).json({
        status: 1,
        msg: "status updated successfully.",
        order: request_row
      });
    }
    catch (error) {
      console.error("Error assigning rider:", error.message);
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
        return res.status(200).json({
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

      const assignedSubCategories = await this.rider.getSubCategoriesByRiderId(loggedInUser.id);
      // console.log("assignedSubCategories:",assignedSubCategories);return;

      if (!assignedSubCategories || assignedSubCategories.length === 0) {
        return res.status(200).json({
          status: 0,
          msg: "You are not assigned any vehicle category."
        });
      }


      // Step 2: Fetch the request quote by ID
      const requestQuote = await this.rider.getRequestQuoteById(request_id);
      if (!requestQuote) {
        return res
          .status(200)
          .json({ status: 0, msg: "Request quote not found." });
      }
      // console.log(requestQuote)

      // NEW: Prevent assignment if request is already cancelled & approved
      if (requestQuote.is_cancelled === "approved") {
        return res.status(200).json({
          status: 0,
          msg: "This request has been cancelled and cannot be accepted."
        });
      }

      const selectedVehicle = requestQuote.selected_vehicle;

      // Check if selected vehicle is among assigned categories
      if (!assignedSubCategories.includes(selectedVehicle)) {
        return res.status(200).json({
          status: 0,
          msg: "You are not assigned to the selected vehicle category for this request."
        });
      }


      // Step 3: Check if a rider is already assigned
      if (requestQuote.assigned_rider) {
        return res.status(200).json({
          status: 0,
          msg: "Rider is already assigned to this request."
        });
      }
      // console.log(requestQuote.assigned_rider)
      const userRow = await this.member.findById(requestQuote.user_id);
      if (!userRow) {
        return res.status(200).json({ status: 0, msg: "Error fetching user" });
      }

      // const riderRow = await this.rider.findById(requestQuote.assigned_rider);
      // if (!riderRow) {
      //   return res.status(200).json({ status: 0, msg: "Error fetching rider" });
      // }
      // console.log("riderRow:",riderRow)

      // 🚨 CHECK: Rider already has active job
      const activeJob = await this.rider.getActiveJobByRider(loggedInUser.id);

      if (activeJob) {
        return res.status(200).json({
          status: 0,
          msg: "You already have an active job. Complete it before accepting a new one."
        });
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
        const parcels = await this.rider.getParcelDetailsByQuoteId(
          request_row.id
        );
        const order_stages_arr = await this.rider.getRequestOrderStages(request_row.id);

        const categoryInfo = request_row.selected_vehicle
          ? await VehicleModel.getCategoryAndMainCategoryById(request_row.selected_vehicle)
          : null;

        if (user) {
          request_row = {
            ...request_row,
            categoryInfo,
            user_name: user?.full_name,
            user_image: user?.mem_image,
            vias: vias,
            parcels: parcels,
            order_stages: order_stages_arr,
            rider_name: loggedInUser?.full_name,
            start_date: helpers.formatDateToUK(request_row?.start_date),
            assigned_sub_categories: assignedSubCategories,

          };
        }
      }

      const encodedId = helpers.doEncode(String(request_id)); // Convert order.id to a string

      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

      // console.log(orderDetailsLink);return;
      // Step 6: Send notification to the user
      const notificationText = `Your request #${request_id} has been assigned to a rider.`;

      const exists = await helpers.notificationExists(
        request_row.user_id,
        userRow.mem_type,
        'request_assigned',
        request_id
      );

      // console.log("exists:", exists)

      if (!exists) {

        await helpers.storeNotification(
          request_row.user_id, // The user ID from request_quote
          userRow?.mem_type, // The user's member type
          loggedInUser.id,
          notificationText,
          orderDetailsLink,
          'request_assigned',
          request_id
        );
      }

      let adminData = res.locals.adminData;
      const user = await this.member.findById(request_row.user_id);

      await helpers.sendEmail(
        user.email,
        "Request Accepted",
        "rider-job-acceptance-email",
        {
          adminData,
          order: request_row,
          type: "user"
        }
      );

      const templateData = {
        username: user.full_name, // Pass username
        adminData,
        order: request_row,
        type: "user"
      };
      // console.log("templateData:",templateData)

      return res.status(200).json({
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
      const { token, memType, status, search } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res.status(200).json({
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
        status: status,
        search: search
      });

      // console.log("riderOrders:",riderOrders)


      // // Encode the `id` for each order
      // const ordersWithEncodedIds = riderOrders.map((order) => {
      //   const encodedId = helpers.doEncode(String(order.id)); // Convert order.id to a string
      //   return { ...order, encodedId }; // Add encodedId to each order
      // });

      const ordersWithEncodedIds = [];

      for (const order of riderOrders) {
        const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);
        // console.log("jobStatus:", jobStatus)
        const encodedId = helpers.doEncode(String(order.id));
        const formatted_end_date = order?.end_date
          ? helpers.formatDateToUK(order.end_date)
          : "Will be available after rider accepts the order";

        ordersWithEncodedIds.push({
          ...order,
          formatted_start_date: helpers.formatDateToUK(order?.start_date),
          formatted_end_date: formatted_end_date,
          encodedId,
          jobStatus,
        });
      }



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
        return res.status(200).json({
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
      const bank_payment_methods = await this.rider.getWithdrawalPamentMethods(
        rider?.id,
        "bank-account"
      );
      const paypal_payment_methods =
        await this.rider.getWithdrawalPamentMethods(rider?.id, "paypal");
      // console.log("Rider Orders with Encoded IDs:", ordersWithEncodedIds);

      // Return the fetched orders with encoded IDs
      return res.status(200).json({
        status: 1,
        states: states,
        bank_payment_methods: bank_payment_methods,
        paypal_payment_methods: paypal_payment_methods
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
      const {
        token,
        memType,
        bank_name,
        account_title,
        account_number,
        swift_routing_no,
        country,
        state,
        city,
        paypal_email,
        payment_method
      } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res.status(200).json({
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
      if (payment_method == "bank-account") {
        cleanedData = {
          bank_name: typeof bank_name === "string" ? bank_name.trim() : "",
          account_title:
            typeof account_title === "string" ? account_title.trim() : "",
          account_number: account_number.trim(),
          swift_routing_no: swift_routing_no.trim(),
          country: country.trim(),
          state: state.trim(),
          city: city.trim(),
          mem_id: rider?.id,
          payment_method: payment_method,
          created_at: created_at
        };
      } else if (payment_method == "paypal") {
        cleanedData = {
          paypal_email:
            typeof paypal_email === "string" ? paypal_email.trim() : "",
          mem_id: rider?.id,
          payment_method: payment_method,
          created_at: created_at
        };
      }
      // console.log(validateRequiredFields(cleanedData))
      // Validation for empty fields
      if (!validateRequiredFields(cleanedData)) {
        return res
          .status(200)
          .json({ status: 0, msg: "All fields are required." });
      } else {
        const riderOrders = await this.rider.createWithdrawanMethod(
          cleanedData
        );
        return res.status(200).json({
          status: 1,
          msg: "Added successfully!"
        });
      }

      return res.status(200).json({
        status: 1,
        states: states
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
      const {
        token,
        memType,
        bank_name,
        account_title,
        account_number,
        swift_routing_no,
        country,
        state,
        city,
        paypal_email,
        payment_method,
        payment_method_id
      } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res.status(200).json({
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
      if (
        payment_method_id !== null &&
        payment_method_id !== "" &&
        payment_method_id !== undefined
      ) {
        const payment_method_row =
          await this.rider.getWithdrawalPamentMethodRow(
            rider?.id,
            payment_method_id
          );
        if (payment_method_row?.length === 0) {
          return res.status(200).json({
            status: 0,
            msg: "Invalid payment method to update!"
          });
        }
      } else {
        return res.status(200).json({
          status: 0,
          msg: "Invalid payment method to update!"
        });
      }

      const created_at = helpers.getUtcTimeInSeconds();
      let cleanedData = {};
      if (payment_method == "bank-account") {
        cleanedData = {
          bank_name: typeof bank_name === "string" ? bank_name.trim() : "",
          account_title:
            typeof account_title === "string" ? account_title.trim() : "",
          account_number: account_number.trim(),
          swift_routing_no: swift_routing_no.trim(),
          country: country.trim(),
          state: state.trim(),
          city: city.trim(),
          mem_id: rider?.id,
          payment_method: payment_method,
          created_at: created_at
        };
      } else if (payment_method == "paypal") {
        cleanedData = {
          paypal_email:
            typeof paypal_email === "string" ? paypal_email.trim() : "",
          mem_id: rider?.id,
          payment_method: payment_method,
          created_at: created_at
        };
      }
      // console.log(validateRequiredFields(cleanedData))
      // Validation for empty fields
      if (!validateRequiredFields(cleanedData)) {
        return res
          .status(200)
          .json({ status: 0, msg: "All fields are required." });
      } else {
        const riderOrders = await this.rider.updateWithdrawalMethod(
          cleanedData,
          { id: payment_method_id }
        );
        return res.status(200).json({
          status: 1,
          msg: "Updated successfully!"
        });
      }

      return res.status(200).json({
        status: 1,
        states: states
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
      const { token, memType, payment_method_id } = req.body;

      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res.status(200).json({
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
      if (
        payment_method_id !== null &&
        payment_method_id !== "" &&
        payment_method_id !== undefined
      ) {
        const payment_method_row =
          await this.rider.getWithdrawalPamentMethodRow(
            rider?.id,
            payment_method_id
          );
        if (payment_method_row?.length === 0) {
          return res.status(200).json({
            status: 0,
            msg: "Invalid payment method to update!"
          });
        }
        const whereCondition = { id: payment_method_id };

        const result = await this.rider.deleteWithdrawalMethod(whereCondition);
        return res.status(200).json({
          status: 1,
          msg: "Deleted successfully!"
        });
      } else {
        return res.status(200).json({
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
  async getThreeDaysBeforeEarnings(req, res) {
    try {
      const rows = await this.rider.getEarningsBefore3Days();
      let adminData = res.locals.adminData;
      // Extract unique user IDs
      const uniqueUserIds = [...new Set(rows.map((row) => row.user_id))];

      // Update earning statuses to "cleared" in a single batch process
      for (const row of rows) {
        await this.rider.updateEarningStatusToCleared(row.id);
      }
      for (const userId of uniqueUserIds) {
        const userRow = await this.rider.findById(userId);

        if (userRow) {
          await helpers.sendEmail(
            userRow.email,
            `Your Earnings Have Been Added – Ready for Withdrawal!`,
            "earnings",
            {
              username: userRow?.full_name,
              adminData
            }
          );
        }
      }
      return res.status(200).json({
        status: 1,
        msg: "Emails sent successfully and earnings updated."
      });
    } catch (error) {
      console.error("Error in getThreeDaysBeforeEarnings:", error);
      return res.status(500).json({
        status: 0,
        msg: "Internal server error.",
        error: error.message
      });
    }
  }

  async getCompleteOrderObject(rider_id, order_id, encodedId) {
    let order = await this.rider.getOrderDetailsById({
      assignedRiderId: rider_id,
      requestId: order_id
    });
    // console.log(rider.id, decodedId)
    // console.log("Order from DB:", order); // Add this line to log the order fetched from the database

    if (!order) {
      return res.status(200).json({ status: 0, msg: "Order not found." });
    }
    const viasCount = await this.rider.countViasBySourceCompleted(order.id);

    // const parcels = await this.rider.getParcelsByQuoteId(order.id); // Assuming order.quote_id is the relevant field
    const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
    const order_stages_arr = await this.rider.getRequestOrderStages(order.id);
    const vias = await this.rider.getViasByQuoteId(order.id);
    const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
    const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
    const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);
    const reviews = await this.rider.getOrderReviews(order.id);
    // console.log(paidAmount,dueAmount)

    const formattedPaidAmount = helpers.formatAmount(paidAmount);
    const formattedDueAmount = helpers.formatAmount(dueAmount);

    const source_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'source' });
    const destination_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'destination' });
    for (let via of vias) {
      const via_attachments = await helpers.getDataFromDB('request_quote_attachments', {
        request_id: order.id,
        type: 'via',
        via_id: via?.id
      });

      via.attachments = via_attachments; // Add attachments array to each via
    }
    let vehicle = order.selected_vehicle
      ? await VehicleModel.getVehicleById(order.selected_vehicle)
      : null;
    order = {
      ...order,
      formatted_start_date: helpers.formatDateToUK(order?.start_date),
      formatted_end_date: helpers.formatDateToUK(order?.end_date),
      encodedId: encodedId,
      parcels: parcels,
      order_stages: order_stages_arr,
      vias: vias,
      invoices: invoices,
      viasCount: viasCount,
      formattedPaidAmount,
      formattedDueAmount,
      reviews: reviews,
      dueAmount: dueAmount,
      vehicle,
      source_attachments: source_attachments,
      destination_attachments: destination_attachments
    };
    return order;
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
      if (
        order.assigned_rider !== null &&
        order.assigned_rider !== rider.id
      ) {
        return res.status(200).json({
          status: 0,
          msg: "This order is not assigned to the logged-in rider."
        });
      }
      // console.log(order, "order")
      // console.log("Assigned Rider:", order.assigned_rider, "Logged Rider:", rider.id);
      // console.log("Final Order:", order);

      // 🔥 NEW — Get updated job status based on stages
      const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);
      // console.log("jobStatus:", jobStatus)
      // console.log("order.id:", order.id)


      const vehicle = order.selected_vehicle
        ? await VehicleModel.getVehicleCategoryById(order.selected_vehicle)
        : null;

      const selectedVehicle = order?.selected_vehicle
        ? await VehicleModel.getSelectedVehicleById(order?.selected_vehicle)
        : null;


      const categoryInfo = order.selected_vehicle
        ? await VehicleModel.getCategoryAndMainCategoryById(order.selected_vehicle)
        : null;

      const viasCount = await this.rider.countViasBySourceCompleted(order.id);

      // const parcels = await this.rider.getParcelsByQuoteId(order.id); // Assuming order.quote_id is the relevant field
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
      const order_stages = await this.rider.getRequestOrderStages(order.id);
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);
      const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);
      const reviews = await this.rider.getOrderReviews(order.id);
      // console.log(paidAmount,dueAmount)
      const riderNotes = await this.rider.getRiderNotes(
        rider.id,
        decodedId
      );

      const formattedPaidAmount = helpers.formatAmount(paidAmount);
      const formattedDueAmount = helpers.formatAmount(dueAmount);

      const source_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'source' });
      const destination_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'destination' });
      for (let via of vias) {
        const via_attachments = await helpers.getDataFromDB('request_quote_attachments', {
          request_id: order.id,
          type: 'via',
          via_id: via?.id
        });

        via.attachments = via_attachments; // Add attachments array to each via
      }

      const formatted_end_date = order?.end_date
        ? helpers.formatDateToUK(order.end_date)
        : "Will be available after rider accepts the order";

      order = {
        ...order,
        formatted_start_date: helpers.formatDateToUK(order?.start_date),
        formatted_end_date: formatted_end_date,
        encodedId: encodedId,
        parcels: parcels,
        order_stages: order_stages,
        vias: vias,
        invoices: invoices,
        riderNotes: riderNotes,
        viasCount: viasCount,
        formattedPaidAmount,
        formattedDueAmount,
        reviews: reviews,
        dueAmount: dueAmount,
        vehicle,
        selectedVehicle,
        source_attachments: source_attachments,
        destination_attachments: destination_attachments,
        category_name: categoryInfo?.category_name || null,
        main_category_name: categoryInfo?.main_category_name || null,
        jobStatus: jobStatus

      };
      // Fetch parcels and vias based on the quoteId from the order
      // Assuming order.quote_id is the relevant field

      // console.log("order:",order)

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
    // console.log(token);
    try {
      // Validate token and fetch rider details
      const rider = await this.validateTokenAndGetMember(token, memType);
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }
      if (rider?.status === 0) {
        return res.status(200).json({ status: 0, msg: rider?.msg });
      }

      // Decode the encoded ID
      const requestId = helpers.doDecode(encodedId);
      if (!requestId) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }
      // console.log(rider);return;
      // Fetch the request by assigned rider and ID
      const request = await this.rider.getRequestById(requestId, rider.user.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(requestId);

      if (!request) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }
      const userRow = await this.member.findById(request[0].user_id);
      if (!userRow) {
        return res.status(200).json({ status: 0, msg: "Error fetching user" });
      }

      let notificationText = "";

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

        let adminData = res.locals.adminData;
        let request_row = request[0];
        const sourcePickedTime = helpers.convertUtcSecondsToUKTime(pickedTime);
        // console.log("sourcePickedTime:", sourcePickedTime)
        const requestRow = {
          ...request_row,
          parcels: parcels,
          rider_name: rider.user?.full_name,
          picked_time: sourcePickedTime
        };

        await helpers.sendEmail(
          userRow.email,
          "Order picked from source",
          "source-picked-email",
          {
            adminData,
            order: requestRow,
            type: "user",
            address: request_row?.source_address
          }
        );



        const templateData = {
          username: userRow.full_name, // Pass username
          adminData,
          order: requestRow,
          type: "user"
        };
        // console.log("order:",requestRow);

        notificationText = `Your request #${request_row.id} has been accepted by a rider at the source location: ${request_row?.source_address}.`;
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
        let adminData = res.locals.adminData;
        let request_row = request[0];
        const viaPickedTime = helpers.convertUtcSecondsToUKTime(pickedViaTime);

        const requestRow = {
          ...request_row,
          parcels: parcels,
          rider_name: rider.user?.full_name,
          picked_time: viaPickedTime
        };

        await helpers.sendEmail(
          userRow.email,
          "Rider reached at: " + via?.address,
          "source-picked-email",
          {
            adminData,
            order: requestRow,
            type: "user",
            address: via?.address
          }
        );



        notificationText = `Your request #${request_row.id} has been accepted by a rider at the via location: ${via?.address}.`;
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
        let adminData = res.locals.adminData;
        let request_row = request[0];
        const destinationPickedTime = helpers.convertUtcSecondsToUKTime(deliveredTime);

        const requestRow = {
          ...request_row,
          parcels: parcels,
          rider_name: rider.user?.full_name,
          picked_time: destinationPickedTime
        };

        await helpers.sendEmail(
          userRow.email,
          "Rider reached at: " + request_row?.dest_address,
          "source-picked-email",
          {
            adminData,
            order: requestRow,
            type: "user",
            address: request_row?.dest_address
          }
        );


        notificationText = `Your request #${request_row.id} has been accepted by a rider at the destination location: ${request_row?.dest_address}.`;
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
      const vias = await this.rider.getViasByQuoteId(order.id);
      const invoices = await this.rider.getInvoicesDetailsByRequestId(order.id);

      const paidAmount = await RequestQuoteModel.totalPaidAmount(order.id);
      const dueAmount = await RequestQuoteModel.calculateDueAmount(order.id);

      const formattedPaidAmount = helpers.formatAmount(paidAmount);
      const formattedDueAmount = helpers.formatAmount(dueAmount);
      const source_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'source' });
      const destination_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'destination' });
      for (let via of vias) {
        const via_attachments = await helpers.getDataFromDB('request_quote_attachments', {
          request_id: order.id,
          type: 'via',
          via_id: via?.id
        });

        via.attachments = via_attachments; // Add attachments array to each via
      }
      const completeOrder = {
        ...order,
        encodedId,
        vias,
        parcels,
        invoices,
        viasCount,
        formattedPaidAmount,
        formattedDueAmount,
        dueAmount: dueAmount,
        source_attachments: source_attachments,
        destination_attachments: destination_attachments
      };

      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

      // const notificationText = `Your request #${order.id} has been accepted by a rider.`;
      await helpers.storeNotification(
        order.user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        rider.user.id, // Use rider's ID as the sender
        notificationText,
        orderDetailsLink
      );
      // console.log("notificationText:",notificationText)
      let completeOrderNew = await this.getCompleteOrderObject(rider.user.id, requestId, encodedId);
      return res.status(200).json({
        status: 1,
        order: completeOrderNew
      });
    } catch (error) {
      console.error("Error in updateRequestStatus:", error);
      return res.status(200).json({ status: 0, msg: "Server error." });
    }
  };

  //   router.post('/mark-as-completed', async (req, res) => {
  updateStageCharges = async (req, res) => {
    const {
      token,
      order_id,
      handballCharges,
      waitingCharges,
      stage_id,
    } = req.body;

    try {
      // ✅ Validate rider
      const rider = await this.validateTokenAndGetMember(token, "rider");
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }

      if (!order_id) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }

      // ✅ Fetch base request
      const request = await this.rider.getRequestById(order_id, rider.user.id);
      if (!request || request.length === 0) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }

      const requestData = request[0];
      const user = await this.rider.getUserById(requestData.user_id);
      if (!user) {
        return res.status(200).json({ status: 0, msg: "User not found." });
      }

      // ✅ Fetch parcels
      const parcelsArray = await this.rider.getParcelDetailsByQuoteId(requestData.id);

      // ✅ Build a clean "order" object for emails/templates
      const order = {
        ...requestData,
        parcels: parcelsArray,
        start_date: helpers.formatDateToUK(requestData.start_date),
      };

      // ✅ Coerce numeric fields (for .toFixed in EJS template)
      order.total_amount = parseFloat(order.total_amount || 0);
      order.tax = parseFloat(order.tax || 0);
      order.distance = parseFloat(order.distance || 0);

      // ✅ Fetch stage row
      const stage_row = await this.rider.getRequestOrderStageRow(order_id, stage_id);
      if (!stage_row) {
        return res.status(200).json({ status: 0, msg: "Stage row not found." });
      }

      const encodedId = helpers.doEncode(String(order_id));
      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

      // -------------------
      // HANDLING HANDBALL
      // -------------------
      if (handballCharges) {
        const formattedHandballCharges = parseFloat(helpers.formatAmount(handballCharges));

        await this.rider.updateOrderStageData(stage_id, {
          handball_charges: formattedHandballCharges,
          updated_time: helpers.getUtcTimeInSeconds(),
        });

        const updatedStageRow = await this.rider.getRequestOrderStageRow(order_id, stage_id);

        const handballInvoice = await this.rider.createInvoiceEntry(
          order_id,
          formattedHandballCharges,
          "handball",
          1,
          null,
          stage_id,
          "charges"
        );

        if (!handballInvoice) {
          return res.status(200).json({ status: 0, msg: "Error creating handball invoice" });
        }

        const notificationText = `Handball charges added for: ${order.booking_id}`;
        await helpers.storeNotification(
          user.id,
          "user",
          rider.user.id,
          notificationText,
          orderDetailsLink
        );

        // ✅ Use "order" (flattened with parcels) instead of request
        const adminData = res.locals.adminData;
        await helpers.sendEmail(
          user.email,
          notificationText,
          "charges-added",
          {
            adminData,
            order,
            stage: updatedStageRow,
            type: "user",
          }
        );
      }

      // -------------------
      // HANDLING WAITING
      // -------------------
      if (waitingCharges) {
        const formattedWaitingCharges = parseFloat(helpers.formatAmount(waitingCharges));

        await this.rider.updateOrderStageData(stage_id, {
          waiting_charges: formattedWaitingCharges,
          updated_time: helpers.getUtcTimeInSeconds(),
        });

        const updatedStageRow = await this.rider.getRequestOrderStageRow(order_id, stage_id);

        const waitingInvoice = await this.rider.createInvoiceEntry(
          order_id,
          formattedWaitingCharges,
          "waiting",
          1,
          null,
          stage_id,
          "charges"
        );

        if (!waitingInvoice) {
          return res.status(200).json({ status: 0, msg: "Error creating waiting invoice" });
        }

        const notificationText = `Waiting charges added for: ${order.booking_id}`;
        await helpers.storeNotification(
          user.id,
          "user",
          rider.user.id,
          notificationText,
          orderDetailsLink
        );

        const adminData = res.locals.adminData;
        await helpers.sendEmail(
          user.email,
          notificationText,
          "charges-added",
          {
            adminData,
            order,              // ✅ flattened order
            stage: updatedStageRow,
            type: "user",
          }
        );
      }

      // -------------------
      // Final response
      // -------------------
      // console.log("order.distance:", order.distance);



      let orderDetails = await this.getCompleteOrderObject(rider.user.id, order_id, encodedId);

      const jobStatus = await helpers.updateRequestQuoteJobStatus(order_id);


      orderDetails = { ...orderDetails, jobStatus };

      return res.json({
        status: 1,
        msg: "updated successfully",
        order: orderDetails,
      });

    } catch (error) {
      console.error("Error in updating charges or attachments:", error);
      res.status(500).json({ status: 0, msg: "Server error" });
    }
  };

  updateStageStatus = async (req, res) => {
    const {
      type,
      token,
      order_id,
      status,
      stage_id,
    } = req.body;
    try {
      const rider = await this.validateTokenAndGetMember(token, "rider");
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }
      if (!order_id) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }
      const request = await this.rider.getRequestById(
        order_id,
        rider.user.id
      );
      if (!request) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }
      const requestData = request[0];

      const user = await this.rider.getUserById(requestData?.user_id);

      if (!user) {
        return res.status(200).json({ status: 0, msg: "User not found." });
      }

      // console.log("user:", user, "user_id:", requestData.user_id);
      const stage_row = await this.rider.getRequestOrderStageRow(
        order_id,
        stage_id
      );
      if (!stage_row) {
        return res.status(200).json({ status: 0, msg: "Request is not found." });
      }

      // await this.rider.updateOrderStageData(stage_id, {
      //   status: status,
      //   updated_time: helpers.getUtcTimeInSeconds()
      // });

      let updateData = {
        status: status,
        updated_time: helpers.getUtcTimeInSeconds()
      };


      // Store time when loaded
      if (status === "loaded") {
        updateData.loaded_time = helpers.getUtcTimeInSeconds();
      }

      await this.rider.updateOrderStageData(stage_id, updateData);


      const parcelsArray = await this.rider.getParcelDetailsByQuoteId(requestData.id);


      const order = {
        ...requestData,
        parcels: parcelsArray,
        start_date: helpers.formatDateToUK(requestData.start_date),
      };

      // ✅ Coerce numeric fields (for .toFixed in EJS template)
      order.total_amount = parseFloat(order.total_amount || 0);
      order.tax = parseFloat(order.tax || 0);
      order.distance = parseFloat(order.distance || 0);

      const encodedId = helpers.doEncode(String(order_id));


      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;


      const notificationText = `Status has been changed to: "${status}" for booking ${requestData?.booking_id}`;
      await helpers.storeNotification(
        user?.id, // The user ID from request_quote
        "user", // The user's member type
        rider.user.id, // Use rider's ID as the sender
        notificationText,
        orderDetailsLink
      );

      let adminData = res.locals.adminData;


      const result = await helpers.sendEmail(
        user?.email,
        `Status changed for: ${requestData.booking_id}`,
        "status-changed",
        {
          adminData,
          order,
          stage: stage_row,
          type: "user",
        }
      );


      let orderDetails = await this.getCompleteOrderObject(rider.user.id, order_id, encodedId);

      const jobStatus = await helpers.updateRequestQuoteJobStatus(order_id);

      // console.log("jobStatus in update stage status:",jobStatus)


      orderDetails = { ...orderDetails, jobStatus };

      return res.json({
        status: 1,
        msg: "updated successfully",
        order: orderDetails,
      });
    }
    catch (error) {
      console.error("Error in updating charges or attachments:", error);
      res.status(500).json({ status: 0, msg: "Server error" });
    }
  };

  markRiderOrdersReady = async (req, res) => {
    // console.log('hy');
    try {
      const { token, mem_type, request_id, stage_id } = req.body;
      // console.log("req.body:", req.body)

      // 1️⃣ Validate rider token
      const rider = await this.validateTokenAndGetMember(token, mem_type || "rider");
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }

      // 2️⃣ Validate request/order ID
      if (!request_id) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }

      // 3️⃣ Fetch the order
      const request = await this.rider.getRequestById(request_id, rider.user.id);
      if (!request || request.length === 0) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }
      const member_row = await this.member.findById(request[0].user_id);


      const stage_row = await this.rider.getRequestOrderStageRow(
        request_id,
        stage_id
      );
      if (!stage_row) {
        return res.status(200).json({ status: 0, msg: "Request is not found." });
      }

      let requestData = request[0];

      // ⛔ NEW: Prevent marking as ready if order is cancelled
      if (requestData.is_cancelled === "approved") {
        return res.status(200).json({
          status: 0,
          msg: "This request has been cancelled and cannot be marked as ready."
        });
      }
      const parcels_arr = await this.rider.getParcelDetailsByQuoteId(
        request_id
      );

      // 4️⃣ Fetch the user who created the request
      const user = await this.rider.getUserById(requestData?.user_id);
      if (!user) {
        return res.status(200).json({ status: 0, msg: "User not found." });
      }

      // 5️⃣ Mark the order as ready
      const readyTime = await this.rider.markOrderReady(request_id);

      // 8️⃣ Build complete order object for email/notification
      requestData = {
        ...requestData,
        parcels: parcels_arr || [],
        rider_name: rider.user?.full_name || ""
      };
      let adminData = res.locals.adminData;

      const encodedId = helpers.doEncode(String(request_id));

      await helpers.sendEmail(
        member_row.email,
        "Rider reached pickup location: " + stage_row.address,
        "rider-reached-location",
        {
          adminData,
          order: requestData,
          type: "user",
          address: stage_row.address,
          rider: rider.user

        }
      );
      let notificationText = `Your rider is on the way to the pickup location: ${stage_row.address}.`;
      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;


      // const notificationText = `Your request #${order.id} has been marked as completed.`;

      await helpers.storeNotification(
        requestData.user_id, // The user ID from request_quote
        member_row?.mem_type, // The user's member type
        rider.user.id,
        notificationText,
        orderDetailsLink
      );


      // 🔥 THEN get final order object (NOW includes updated job_status)
      let updatedOrder = await this.getCompleteOrderObject(
        rider.user.id,
        request_id,
        helpers.doEncode(String(request_id))
      );

      // If you still want this:
      const jobStatus = await helpers.updateRequestQuoteJobStatus(request_id);

      updatedOrder = { ...updatedOrder, jobStatus };


      return res.json({
        status: 1,
        msg: "Order marked as ready",
        order: updatedOrder,

      });

    } catch (error) {
      console.error("Error marking order ready:", error);
      return res.status(500).json({ status: 0, msg: "Server error" });
    }
  };

  completeOrderStage = async (req, res) => {
    const {
      token,
      order_id,
      stage_id,
      handball_charges,
      waiting_charges,
      receiver_name,
      receiver_signature,
      attachments
    } = req.body;
    // console.log("chargesin api", req.body)
    try {
      const rider = await this.validateTokenAndGetMember(token, "rider");
      if (!rider) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }
      if (!order_id) {
        return res.status(200).json({ status: 0, msg: "Invalid request ID." });
      }
      // console.log(rider, "rider")

      const request = await this.rider.getRequestById(
        order_id,
        rider.user.id
      );
      if (!request) {
        return res.status(200).json({ status: 0, msg: "Request not found." });
      }

      const requestData = request[0];

      const user = await this.rider.getUserById(requestData?.user_id);

      if (!user) {
        return res.status(200).json({ status: 0, msg: "User not found." });
      }
      const stage_row = await this.rider.getRequestOrderStageRow(
        order_id,
        stage_id
      );
      if (!stage_row) {
        return res.status(200).json({ status: 0, msg: "Request is not found." });
      }

      const vias = await this.rider.getViasByQuoteId(order_id);

      const normalize = (str) => (str || "").trim().toLowerCase();

      const isReceiverRequired = vias?.some(
        (via) =>
          normalize(via?.address) === normalize(stage_row?.address) &&
          via?.via_delivery_option === "delivery"
      );

      if (isReceiverRequired && (!receiver_name || !receiver_signature)) {
        return res.status(200).json({
          status: 0,
          msg: "Receiver name and signature are required"
        });
      }

      // ✅ Prevent marking a stage as completed if it is already completed
      if (stage_row.status === "completed") {
        return res.status(200).json({
          status: 0,
          msg: "This stage has already been marked as completed."
        });
      }

      let attachments_arr = attachments !== null && attachments !== undefined && attachments !== '' ? JSON.parse(attachments) : [];
      if (attachments_arr?.length > 0) {
        for (let attachment of attachments_arr) {
          await helpers.insertData('order_stages_attachments', {
            stage_id: stage_id,
            file_name: attachment,
            created_time: helpers.getUtcTimeInSeconds()
          });
        }
      }
      else {
        return res.status(200).json({ status: 0, msg: "Add atleast one attachment to continue" });
      }

      let signatureFileName = null;

      if (receiver_signature && receiver_signature.startsWith("data:image")) {
        const mime = receiver_signature.substring(receiver_signature.indexOf("/") + 1, receiver_signature.indexOf(";"));
        const ext = mime === "jpeg" ? "jpg" : mime;
        signatureFileName = `signature_${Date.now()}.${ext}`;
        const base64Data = receiver_signature.replace(/^data:image\/\w+;base64,/, "");
        const filePath = path.join(__dirname, "../../uploads", signatureFileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      } else if (receiver_signature) {
        signatureFileName = receiver_signature; // multer uploaded file
      }



      // Fetch updated stage row
      const updatedStage = await this.rider.getRequestOrderStageRow(order_id, stage_id);

      const parcelsArray = await this.rider.getParcelDetailsByQuoteId(requestData.id);

      const order = {
        ...requestData,
        parcels: parcelsArray,
        start_date: helpers.formatDateToUK(requestData.start_date),
      };

      // ✅ Coerce numeric fields (for .toFixed in EJS template)
      order.total_amount = parseFloat(order.total_amount || 0);
      order.tax = parseFloat(order.tax || 0);
      order.distance = parseFloat(order.distance || 0);


      // ---- CHECK IF HANDBALL CHARGES ALREADY PAID ----
      const existingHandballInvoice = await this.rider.getInvoiceByOrderStageAndType(
        order_id,
        stage_id,
        "handball"
      );

      // ---- CHECK IF WAITING CHARGES ALREADY PAID ----
      const existingWaitingInvoice = await this.rider.getInvoiceByOrderStageAndType(
        order_id,
        stage_id,
        "waiting"
      );


      // -------------------
      // HANDLING HANDBALL
      // -------------------
      if (handball_charges) {

        if (existingHandballInvoice) {
          console.log("Handball charges already paid — skipping.");

        } else {
          const formattedHandballCharges = parseFloat(
            helpers.formatAmount(handball_charges)
          );

          await this.rider.updateOrderStageData(stage_id, {
            handball_charges: formattedHandballCharges,
            updated_time: helpers.getUtcTimeInSeconds(),
          });

          const handballInvoice = await this.rider.createInvoiceEntry(
            order_id,
            formattedHandballCharges,
            "handball",
            1,
            null,
            stage_id,
            "charges"
          );

          if (!handballInvoice) {
            return res.status(200).json({
              status: 0,
              msg: "Error creating handball invoice"
            });
          }
        }
      }



      // -------------------
      // HANDLING WAITING
      // -------------------
      // if (waiting_charges) {

      //   if (existingWaitingInvoice) {
      //     console.log("Waiting charges already paid — skipping.");

      //   } else {
      //     const formattedWaitingCharges = parseFloat(
      //       helpers.formatAmount(waiting_charges)
      //     );

      //     await this.rider.updateOrderStageData(stage_id, {
      //       waiting_charges: formattedWaitingCharges,
      //       updated_time: helpers.getUtcTimeInSeconds(),
      //     });

      //     const waitingInvoice = await this.rider.createInvoiceEntry(
      //       order_id,
      //       formattedWaitingCharges,
      //       "waiting",
      //       1,
      //       null,
      //       stage_id,
      //       "charges"
      //     );

      //     if (!waitingInvoice) {
      //       return res.status(200).json({
      //         status: 0,
      //         msg: "Error creating waiting invoice"
      //       });
      //     }
      //   }
      // }


      // Notifications

      const encodedId = helpers.doEncode(String(order_id));


      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

      const newStatus = 'completed';
             

      // ✅ Only send stage email if NOT last stage
     

      // arrival_time stored in DB
      const arrivalTime = parseInt(stage_row.arrival_time || 0);   // seconds
      // const completedTime = parseInt(stage_row.completed_time || 0);   // seconds
      const completedTime = helpers.getUtcTimeInSeconds();
      let updateData = {
        status: newStatus,
        updated_time: completedTime,
        completed_time: completedTime,
        receiver_name: receiver_name || null,          // add receiver name
        receiver_signature: signatureFileName || null
      };

      let autoWaitingCharge = 0;  // IMPORTANT so it can be used outside IF

      if (arrivalTime > 0 && !existingWaitingInvoice) {

        // console.log("arrivalTime:", arrivalTime);

        // 1: Get waiting minutes using your function
        const diffMinutes = await this.getWaitingMinutes(arrivalTime);
        // console.log("diffMinutes:", diffMinutes);

        // If no waiting → stop
        if (diffMinutes <= 0) {
          console.log("No waiting charges applied.");
          updateData.waiting_charges = 0;
        } else {

          // 2: Convert minutes → 15-minute slots
          const slots = Math.ceil(diffMinutes / 15);
          // console.log("slots:", slots);

          // 3: Get vehicle waiting charge
          const vehicle = await this.rider.getVehicleById(requestData.selected_vehicle);
          // console.log("vehicle:", vehicle);

          const perSlotCharge = parseFloat(vehicle?.waiting_charges || 0);
          // console.log("perSlotCharge:", perSlotCharge);

          // 4: Final waiting charge
          autoWaitingCharge = slots * perSlotCharge;
          // console.log("autoWaitingCharge:", autoWaitingCharge);

          updateData.waiting_charges = autoWaitingCharge;
          // 5️⃣ Create waiting invoice ONLY if charges > 0
          if (autoWaitingCharge > 0) {

            await this.rider.createInvoiceEntry(
              order_id,
              autoWaitingCharge,
              "waiting",
              1,
              null,
              stage_id,
              "charges"
            );

            console.log("Waiting invoice created.");
          }
        }
      }



      // ✅ Update stage once with all data
      await this.rider.updateOrderStageData(stage_id, updateData);

       const allStages = await this.rider.getOrderStages(order_id);

      const allCompleted = allStages.every((s) => s.status === "completed");

       if (!allCompleted) {
        const notificationText = `Your rider has completed a delivery stage for booking ${requestData.booking_id}.`;
        await helpers.storeNotification(
          user?.id, // The user ID from request_quote
          "user", // The user's member type
          rider.user.id, // Use rider's ID as the sender
          notificationText,
          orderDetailsLink
        );

        let adminData = res.locals.adminData;


        const result = await helpers.sendEmail(
          user?.email,
          `Delivery update: Stage completed for booking ${requestData.booking_id}`,
          "mark-as-completed",

          {
            adminData,
            order,
            stage: updatedStage,
            type: "user",
          }
        );
      }

      // const newStatus = 'completed';
      // await this.rider.updateOrderStageData(stage_id, {
      //   status: newStatus,
      //   updated_time: helpers.getUtcTimeInSeconds(),
      //   completed_time: helpers.getUtcTimeInSeconds()
      // });

      // 🔥 FIRST: check and update job status
      // const allStages = await this.rider.getOrderStages(order_id);
      // const allCompleted = allStages.every((s) => s.status === "completed");

      const dueAmount = await RequestQuoteModel.calculateDueAmount(order_id);
      const noDueLeft = parseFloat(dueAmount) <= 0;

      // if (allCompleted && noDueLeft) {
      //   await this.rider.updateRequestStatus(order_id, {
      //     job_status: "completed",
      //     updated_time: helpers.getUtcTimeInSeconds(),
      //   });
      // }

      if (allCompleted && noDueLeft) {
        const updatedRequest = await helpers.updateRequestStatus(
          order_id,
          "completed"
        );

        // ✅ NEW: Notify user that job is fully completed
        const jobCompletedText = `Your rider has completed your delivery for booking ${requestData.booking_id}.`;

        await helpers.storeNotification(
          user?.id,
          "user",
          rider.user.id,
          jobCompletedText,
          orderDetailsLink
        );

        const allStages = await this.rider.getOrderStages(order_id);
        await this.rider.attachStageAttachments(allStages);
        order.stages = allStages;

        // ✅ OPTIONAL: Send completion email
        await helpers.sendEmail(
          user?.email,
          `Delivery completed for booking ${requestData.booking_id}`,
          "job-completed", // create template if needed
          {
            adminData: res.locals.adminData,
            order,
            rider: rider.user,
            stages: allStages, // ✅ VERY IMPORTANT
            BASE_URL: process.env.BASE_URL, // optional
            type: "user",
          }
        );


        await processRiderCharges({
          order_id: order_id,
          rider_id: requestData?.assigned_rider,
          adminData: res.locals.adminData
        });


        // Assuming requestData contains distance and selected_vehicle/rider price info
        const distance = parseFloat(requestData.distance || 0); // in km
        const riderPrice = parseFloat(requestData.rider_price || 0); // price per km

        const formattedAmount = parseFloat((distance * riderPrice)); // multiply and format
        if (formattedAmount > 0) {
          const created_time = Math.floor(Date.now() / 1000); // UTC seconds
          const earningsData = {
            user_id: rider.user.id,
            amount: formattedAmount,
            type: "credit",
            status: "pending",
            created_time,
            order_id: order_id
          };

          const insertedEarnings = await helpers.insertEarnings(earningsData);

          if (!insertedEarnings) {
            console.log("Failed to insert earnings for rider:", rider.user.id);
          }
        }
      } else {
        console.log(
          "Not inserting earnings: either not last stage or due amount is not 0."
        );
      }





      // 🔥 THEN get final order object (NOW includes updated job_status)
      let orderDetails = await this.getCompleteOrderObject(
        rider.user.id,
        order_id,
        encodedId
      );

      // If you still want this:
      const jobStatus = await helpers.updateRequestQuoteJobStatus(order_id);

      orderDetails = { ...orderDetails, jobStatus };



      return res.json({
        status: 1,
        msg: "updated successfully",
        order: orderDetails,
      });
    }
    catch (error) {
      console.error("Error in updating charges or attachments:", error);
      res.status(500).json({ status: 0, msg: "Server error" });
    }
  };

  getWaitingMinutes = async (arrivalTime) => {
    if (!arrivalTime) return 0;

    // Add 3 minutes (3 * 60 seconds)
    const graceEndTime = arrivalTime + (3 * 60);

    // Current time in UNIX seconds
    const currentTime = Math.floor(Date.now() / 1000);

    // If completed before grace → no waiting
    if (currentTime <= graceEndTime) {
      return 0;
    }

    // Difference in minutes
    const diffMinutes = Math.ceil((currentTime - graceEndTime) / 60);

    return diffMinutes;
  }







  markAsCompleted = async (req, res) => {
    const {
      type,
      token,
      encodedId,
      handball_charges,
      waiting_charges,
      via_id,
      attachments
    } = req.body;
    // console.log(req.body, "req.body");return;

    try {
      let attachments_arr = attachments !== null && attachments !== undefined && attachments !== '' ? JSON.parse(attachments) : [];
      let sourceAttachments = []; // <- declare here

      // console.log(attachments_arr);return;
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
      const parcels_arr = await this.rider.getParcelDetailsByQuoteId(
        decodedRequestId
      );
      const order_stages = await this.rider.getRequestOrderStages(decodedRequestId);
      const member_row = await this.member.findById(request[0].user_id);
      const formattedHandballCharges = helpers.formatAmount(handball_charges);
      const formattedWaitingCharges = helpers.formatAmount(waiting_charges);

      let notificationText = "";

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
            "charges"
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
            "charges"
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
          return res.status(200).json({
            status: 0,
            msg: "Error updating source completion status"
          });
        }
        if (attachments_arr?.length > 0) {
          for (let attachment of attachments_arr) {
            await helpers.insertData('request_quote_attachments', {
              request_id: decodedRequestId,
              file_name: attachment,
              type: 'source',
              created_time: helpers.getUtcTimeInSeconds()
            });
          }
        }


        let adminData = res.locals.adminData;
        let request_row = request[0];
        const sourcePickedTime = helpers.convertUtcSecondsToUKTime(request_row?.picked_time);

        const requestRow = {
          ...request_row, // Spread request properties into order
          parcels: parcels_arr,
          order_stages: order_stages,
          rider_name: rider.user?.full_name,
          picked_time: sourcePickedTime
        };

        await helpers.sendEmail(
          member_row.email,
          "Rider completed at: " + request_row?.source_address,
          "request-mark-as-completed",
          {
            adminData,
            order: requestRow,
            type: "user",
            address: request_row?.source_address,
            invoice: formattedHandballCharges || formattedWaitingCharges ? 1 : 0
          }
        );
        notificationText = `Your request #${request_row?.id} has been marked as completed at the source location: ${request_row?.source_address}.`;
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
            "charges"
          );
          if (!handballInvoice) {
            return res.status(200).json({
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
            "charges"
          );
          if (!waitingInvoice) {
            return res.status(200).json({
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
          return res.status(200).json({
            status: 0,
            msg: "Error updating updated_time in request_quote"
          });
        }
        if (attachments_arr?.length > 0) {
          for (let attachment of attachments_arr) {
            await helpers.insertData('request_quote_attachments', {
              request_id: decodedRequestId,
              file_name: attachment,
              type: 'via',
              via_id: via_id,
              created_time: helpers.getUtcTimeInSeconds()
            });
          }
        }
        let adminData = res.locals.adminData;
        let request_row = request[0];
        const viaPickedTime = helpers.convertUtcSecondsToUKTime(viaRow?.picked_time);
        // console.log("viaTime:", viaPickedTime, viaRow?.picked_time)
        // console.log("viaRow", viaRow)

        const requestRow = {
          ...request_row, // Spread request properties into order
          parcels: parcels_arr,
          order_stages: order_stages,
          rider_name: rider.user?.full_name,
          picked_time: viaPickedTime
        };

        await helpers.sendEmail(
          member_row.email,
          "Rider completed at: " + viaRow?.address,
          "request-mark-as-completed",
          {
            adminData,
            order: requestRow,
            type: "user",
            address: viaRow?.address,
            invoice: formattedHandballCharges || formattedWaitingCharges ? 1 : 0
          }
        );

        notificationText = `Your request #${request_row?.id} has been marked as completed at the via location: ${viaRow?.address}.`;

        // console.log("Creating invoice for destination charges");
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
            "charges"
          );
          if (!handballInvoice) {
            return res.status(200).json({
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
            "charges"
          );
          if (!waitingInvoice) {
            return res.status(200).json({
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
          return res.status(200).json({
            status: 0,
            msg: "Error updating destination completion status"
          });
        }
        let adminData = res.locals.adminData;
        let request_row = request[0];
        const destinationPickedTime = helpers.convertUtcSecondsToUKTime(request_row?.delivered_time);

        const requestRow = {
          ...request_row, // Spread request properties into order
          parcels: parcels_arr,
          order_stages: order_stages,
          rider_name: rider.user?.full_name,
          picked_time: destinationPickedTime
        };
        if (attachments_arr?.length > 0) {
          for (let attachment of attachments_arr) {
            await helpers.insertData('request_quote_attachments', {
              request_id: decodedRequestId,
              file_name: attachment,
              type: 'destination',
              created_time: helpers.getUtcTimeInSeconds()
            });
          }
        }


        await helpers.sendEmail(
          member_row.email,
          "Rider completed at: " + request_row?.dest_address,
          "request-mark-as-completed",
          {
            adminData,
            order: requestRow,
            type: "user",
            address: request_row?.dest_address,
            invoice: formattedHandballCharges || formattedWaitingCharges ? 1 : 0
          }
        );
        notificationText = `Your request #${request_row.id} has been marked as completed at the destination location: ${request_row?.dest_address}.`;
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
        return res.status(200).json({ status: 0, msg: "Error fetching user" });
      }
      const viasCount = await this.rider.countViasBySourceCompleted(order.id);
      // console.log("viasCount:", viasCount);

      // const parcels = await this.rider.getParcelsByQuoteId(order.id);
      const parcels = await this.rider.getParcelDetailsByQuoteId(order.id);
      const order_stages_arr = await this.rider.getRequestOrderStages(order.id);
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
      const source_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'source' });
      const destination_attachments = await helpers.getDataFromDB('request_quote_attachments', { request_id: order.id, type: 'destination' });
      for (let via of vias) {
        const via_attachments = await helpers.getDataFromDB('request_quote_attachments', {
          request_id: order.id,
          type: 'via',
          via_id: via?.id
        });

        via.attachments = via_attachments; // Add attachments array to each via
      }

      const formattedOrder = {
        ...order,
        encodedId,
        vias,
        invoices,
        parcels,
        order_stages: order_stages_arr,
        invoices,
        viasCount,
        formattedPaidAmount,
        formattedDueAmount,
        dueAmount: dueAmount,
        sourceAttachments: sourceAttachments,
        source_attachments: source_attachments,
        destination_attachments: destination_attachments
      };
      // console.log("formattedOrder:",formattedOrder)

      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;

      // const notificationText = `Your request #${order.id} has been marked as completed.`;

      await helpers.storeNotification(
        order.user_id, // The user ID from request_quote
        userRow?.mem_type, // The user's member type
        rider.user.id,
        notificationText,
        orderDetailsLink
      );

      // Step 5: Respond with the updated order
      res.status(200).json({
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
        return res.status(200).json({
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
        return res
          .status(200)
          .json({ status: 0, msg: "Request ID is required" });
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
        return res.status(200).json({ status: 0, msg: "Error fetching user" });
      }
      let adminData = res.locals.adminData;
      // const request = await this.rider.getRequestById(54, 9);
      const parcels = await this.rider.getParcelDetailsByQuoteId(
        decodedRequestId
      );
      let request_row = request[0];
      const sourcePickedTime = helpers.convertUtcSecondsToUKTime(request_row?.picked_time);

      const requestRow = {
        ...request_row, // Spread request properties into order
        parcels: parcels, // Add parcels as an array inside order
        rider_name: rider.user?.full_name,

        picked_time: sourcePickedTime

      };
      const result = await helpers.sendEmail(
        userRow.email,
        "Order is completed - share your Review",
        "request-completed",
        {
          adminData,
          order: requestRow,
          type: "user"
        }
      );
      // console.log("request:",request);return;

      // Update the status using the model
      const updatedRequest = await RequestQuoteModel.updateRequestStatus(
        id,
        "completed"
      );

      await processRiderCharges({
        order_id: request[0]?.id,
        rider_id: rider.user.id,
        adminData: res.locals.adminData
      });


      // console.log("updatedRequest:",updatedRequest)

      if (!updatedRequest) {
        return res.status(200).json({ status: 0, msg: "Request not found" });
      }

      // Step 2: Calculate earnings and insert into the earnings table
      const totalDistance = request[0].total_distance || 0;
      const riderPrice = request[0].rider_price || 0; // Assuming `rider_price` is part of the request data
      const formattedRiderPrice = helpers.formatAmount(riderPrice);

      const amount = totalDistance * formattedRiderPrice;
      const created_time = helpers.getUtcTimeInSeconds();

      const formattedAmount = helpers.formatAmount(amount);

      if (formattedAmount > 0) {
        const earningsData = {
          user_id: rider.user.id,
          amount: formattedAmount,
          type: "credit",
          status: "pending",
          created_time: created_time, // UTC time in seconds,
          order_id: request[0].id
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
        data: updatedRequest
      });
    } catch (error) {
      console.error("Error updating status:", error);
      return res.status(200).json({
        status: 0,
        msg: "An error occurred while updating the status"
      });
    }
  };

  async getRiderDashboardOrders(req, res) {
    try {
      const { token, memType } = req.body;

      // Validate token and memType
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
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
      const riderId = member.id; // Assuming the `id` field contains the rider's unique ID

      // Call the model function to get the completed orders
      const completedOrders = await this.rider.getCompletedOrdersByRider(
        riderId
      );

      // console.log(completedOrders);
      const ordersWithEncodedIds = await Promise.all(
        completedOrders.map(async (order) => {

          const encodedId = helpers.doEncode(String(order.id));

          const jobStatus = await helpers.updateRequestQuoteJobStatus(order.id);

          return {
            ...order,
            encodedId,
            jobStatus
          };
        })
      );


      const currentOrders = await this.rider.getCurrentOrdersByStatus(riderId);

      // Call the model function to get the total orders with status 'completed' or 'accepted'
      const totalOrders = await this.rider.getTotalOrdersByStatus(riderId);

      // Call the model function to get the total number of completed orders
      const totalCompletedOrders = await this.rider.getTotalCompletedOrders(
        riderId
      );
      // console.log(completedOrders, totalOrders, totalCompletedOrders);

      const earningsData = await this.rider.getRiderEarnings(riderId);

      const formattedAvailableBalance = helpers.formatAmount(
        earningsData.availableBalance
      );


      const SumOfClearedEarnings = await this.rider.getRiderClearedEarningsSum(
        riderId
      );


      // Return the response with the fetched orders and total order counts
      return res.status(200).json({
        status: 1,
        msg: "Rider dashboard data fetched successfully.",
        currentOrders,
        ordersWithEncodedIds, // Last 3 completed orders
        totalOrders, // Total number of 'completed' or 'accepted' orders
        totalCompletedOrders, // Total number of 'completed' orders
        SumOfClearedEarnings,
        availableBalance: formattedAvailableBalance,

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

      if (memType !== "rider") {
        // Ensure the memType is 'rider'
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
      // console.log(
      //   "net income:",
      //   earningsData.netIncome,
      //   "available balance:",
      //   earningsData.availableBalance,
      //   earningsData.totalWithdrawn
      // );

      if (!earningsData) {
        return res
          .status(200)
          .json({ status: 0, msg: "No earnings found for this rider." });
      }

      const formattedNetIncome = helpers.formatAmount(earningsData.netIncome);
      const formattedAvailableBalance = helpers.formatAmount(
        earningsData.availableBalance
      );
      const totalWithdrawn = helpers.formatAmount(earningsData.totalWithdrawn);
      // const formattedEarnings = helpers.formatAmount(earningsData.earnings);

      const bank_payment_methods = await this.rider.getWithdrawalPamentMethods(
        riderId,
        "bank-account"
      );
      let bank_payment_methods_arr = [];
      for (let bank_payment_method of bank_payment_methods) {
        let state_name = await helpers.getStateNameByStateId(
          bank_payment_method.state
        );
        bank_payment_method = {
          ...bank_payment_method,
          state: state_name,
          country: "United Kingdom"
        };
        bank_payment_methods_arr.push(bank_payment_method);
      }
      // console.log('bank_payment_methods_arr',bank_payment_methods_arr)
      const paypal_payment_methods =
        await this.rider.getWithdrawalPamentMethods(riderId, "paypal");


      const formattedEarnings = earningsData.earnings.map((earning) => ({
        ...earning,
        encodedId: helpers.doEncode(String(earning.order_id)), // Encode the earning ID
        amount: helpers.formatAmount(earning.amount) // Assuming each earning has an `amount` field
      }));

      // Return earnings data, net income, and available balance
      return res.status(200).json({
        status: 1,
        netIncome: formattedNetIncome,
        availableBalance: formattedAvailableBalance,
        earnings: formattedEarnings,
        totalWithdrawn: totalWithdrawn,
        bank_payment_methods: bank_payment_methods_arr,
        paypal_payment_methods: paypal_payment_methods
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      return res
        .status(200)
        .json({ status: 0, msg: "An error occurred while fetching earnings" });
    }
  }
  async saveWithDrawalRequest(req, res) {
    try {
      const {
        token,
        memType,
        payment_method,
        account_details,
        paypal_details
      } = req.body;

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
        return res
          .status(200)
          .json({ status: 0, msg: "Bank details are required." });
      }

      if (payment_method === "paypal" && !paypal_details) {
        return res
          .status(200)
          .json({ status: 0, msg: "PayPal email is required!" });
      }

      // Get cleared earnings for the rider
      const clearedEarnings = await this.rider.getClearedEarnings(riderId);
      const availableBalance = clearedEarnings.reduce(
        (sum, earning) => sum + parseFloat(earning.amount),
        0
      );

      // Validate available balance
      if (availableBalance <= 0) {
        return res
          .status(200)
          .json({ status: 0, msg: "Insufficient balance for withdrawal." });
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
        // order_id: null // No associated order
      });

      if (!debitEntry) {
        return res
          .status(200)
          .json({ status: 0, msg: "Failed to create debit entry." });
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
        updated_at
      });

      if (!result.insertId) {
        return res
          .status(200)
          .json({ status: 0, msg: "Failed to create withdrawal request." });
      }

      return res
        .status(200)
        .json({ status: 1, msg: "Withdrawal request submitted successfully." });
    } catch (error) {
      console.error("Error in saveWithDrawalRequest:", error);
      return res.status(500).json({ status: 0, msg: "Internal server error." });
    }
  }

  async getRiderDocumentsApi(req, res) {
    try {
      const { token, memType } = req.body;
      // console.log("Received Token:", token);
      // console.log("Received Member Type:", memType);

      // Validate token and memType
      if (!token) {
        return res.status(200).json({ status: 0, msg: "Token is required." });
      }

      if (memType !== "rider") {
        return res.status(200).json({ status: 0, msg: "Invalid member type." });
      }

      // Validate the token and get the rider details
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      // console.log("User Response:", userResponse);

      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const riderId = userResponse.user.id;
      // console.log("Fetching documents for Rider ID:", riderId);

      // Fetch the documents for the given rider_id
      const documents = await RiderModel.getDocuments(riderId);
      // console.log("Fetched Documents:", documents);

      // If no documents are found
      if (documents.length === 0) {
        return res
          .status(200)
          .json({ message: "No documents found for this rider." });
      }

      // Return the list of documents as JSON
      res.status(200).json({ documents });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(200).json({ error: "Failed to fetch documents" });
    }
  }

  async uploadRiderDocument(req, res) {
    try {
      const { req_id, memType, token } = req.body;

      const riderDocument =
        req.files && req.files["rider_document"]
          ? req.files["rider_document"][0].filename
          : "";
      // console.log("req.body", req.body); // Log body data
      // console.log(token, req_id, riderDocument, "all data");

      // Validate request
      if (!token || !req_id || !riderDocument) {
        return res
          .status(200)
          .json({ status: 0, msg: "Missing required fields." });
      }

      // Validate token and get user
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const riderId = userResponse.user.id;
      const rider = userResponse.user;

      // Check if the document belongs to the logged-in user

      const existingDoc = await RiderModel.getDocumentByIdAndRiderId(
        req_id,
        riderId
      );
      // console.log("existingDoc:", existingDoc);

      if (!existingDoc.length) {
        return res.status(200).json({ status: 0, msg: "Unauthorized access." });
      }

      // Encrypt filename and move file

      const encryptedFileName = riderDocument;
      // console.log("encryptedFileName:", encryptedFileName);

      // Update document record
      await RiderModel.updateDocumentNameAndStatus(encryptedFileName, req_id);

      // const updatedDoc = await RiderModel.getDocumentById(req_id);

      //   if (!updatedDoc) {
      //       return res.status(200).json({ status: 0, msg: "Document not found after update." });
      //   }

      //   // Construct document URL
      //   const documentUrl = `${process.env.ADMIN_BASE_URL}/uploads/${updatedDoc.document_name}`;

      let adminData = res.locals.adminData;
      const result = await helpers.sendEmail(
        adminData.receiving_site_email,
        "Document Uploaded: Rider has uploaded the document - FastUk",
        "document-uploaded",
        {
          adminData,
          rider,
          req_id
        }
      );

      res.status(200).json({
        status: 1,
        msg: "File uploaded successfully.",
        encryptedFileName
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(200).json({ status: 0, msg: "Internal server error." });
    }
  }

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
      const documentExists = await RiderModel.getDocumentByIdAndRiderId(
        req_id,
        riderId
      );

      if (!documentExists) {
        return res.status(200).json({
          status: 0,
          msg: "Document not found or does not belong to the rider"
        });
      }

      // Delete the document
      await RiderModel.deleteDocument(req_id, riderId);

      return res.json({ status: 1, msg: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      return res.status(200).json({ status: 0, msg: "Server error" });
    }
  }

  async parcelStatusChange(req, res) {
    try {
      const { parcel_id, token, memType, status } = req.body;
      // console.log("req.body", req.body)

      if (!parcel_id || !token || !memType || !status) {
        return res.status(200).json({ status: 0, msg: "Invalid request data" });
      }

      // Validate user
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const riderId = userResponse.user.id;
      // console.log("riderId:", riderId)

      // Check if parcel exists & belongs to this rider
      const parcelRow = await RiderModel.getParcelsById(parcel_id, riderId);
      if (!parcelRow || parcelRow.length === 0) {
        return res.status(200).json({
          status: 0,
          msg: "Parcel not found",
        });
      }
      // console.log("parcelRow:", parcelRow)

      // ✅ Update the parcel status
      await RiderModel.updateParcelStatus(parcel_id, status);

      // ✅ Fetch updated parcel row
      const updatedParcel = await RiderModel.getParcelsById(parcel_id, riderId);
      // console.log("updatedParcel:", updatedParcel)

      return res.json({
        status: 1,
        msg: "Parcel status updated successfully",
        updatedParcel: updatedParcel[0], // 👈 return updated row
      });
    } catch (error) {
      console.error("Parcel status update error:", error);
      return res.status(200).json({ status: 0, msg: "Server error" });
    }
  }

  async updateParcelStatus(req, res) {
    try {
      const { order_id, token, memType, status, address } = req.body;
      // console.log("req.body", req.body);


      if (!order_id || !token || !memType || !status || !address) {
        return res.status(200).json({ status: 0, msg: "Invalid request data" });
      }

      // ✅ Validate rider
      const userResponse = await this.validateTokenAndGetMember(token, memType);
      if (userResponse.status === 0) {
        return res.status(200).json(userResponse);
      }

      const riderId = userResponse.user.id;
      // console.log("riderId:", riderId);

      // ✅ Fetch order details
      const request_row = await this.rider.getOrderDetailsById({
        assignedRiderId: riderId,
        requestId: order_id,
      });

      if (!request_row) {
        return res.status(200).json({ status: 0, msg: "Order not found" });
      }

      const member_row = await this.member.findById(request_row?.user_id);


      // ❗ NEW — Block rider from updating cancelled-approved orders
      if (request_row?.is_cancelled === "approved") {
        return res.status(200).json({
          status: 0,
          msg: "This order has been cancelled and cannot be updated.",
        });
      }
      const encodedId = helpers.doEncode(String(order_id));
      // console.log(riderId, request_row?.id, encodedId);
      // console.log("request_row",request_row)

      const order_stages = await this.rider.getOrderStages(order_id);

      // console.log("order_stages", order_stages)

      // ✅ Check if stage with matching address exists
      const stageRow = order_stages.find(
        (s) => s.address.trim().toLowerCase() === address.trim().toLowerCase()
      );

      if (!stageRow) {
        return res.status(200).json({
          status: 0,
          msg: "No matching stage found for this order",
        });
      }

      // ✅ Check if stage is already completed or arrived
      if (stageRow.status === "arrived" || stageRow.status === "completed") {
        return res.status(200).json({ status: 0, msg: "This stage has already been marked as done." });
      }


      await this.rider.updateParcelStatus(stageRow.id, status);

      let notificationText = `Your rider has arrived at the location: ${stageRow.address}.`;
      const orderDetailsLink = `/dashboard/order-details/${encodedId}`;


      // const notificationText = `Your request #${order.id} has been marked as completed.`;

      await helpers.storeNotification(
        request_row.user_id, // The user ID from request_quote
        member_row?.mem_type, // The user's member type
        riderId,
        notificationText,
        orderDetailsLink
      );

      const selectedVehicle = request_row?.selected_vehicle
        ? await VehicleModel.getSelectedVehicleById(request_row?.selected_vehicle)
        : null;

      // Recalculate the job status based on current stages
      const jobStatus = await helpers.updateRequestQuoteJobStatus(order_id);
      // console.log("jobStatussss:",jobStatus)





      // (optional) fetch updated order again
      const updatedOrder = await this.rider.getOrderDetailsById({
        assignedRiderId: riderId,
        requestId: order_id,
      });


      let orderDetails = await this.getCompleteOrderObject(riderId, request_row?.id, encodedId);



      // Attach updated jobStatus to orderDetails
      orderDetails = {
        ...orderDetails,
        jobStatus, // <-- include the updated status here
        selectedVehicle
      };

      return res.json({
        status: 1,
        msg: "Stage status updated successfully",
        order: orderDetails,
      });
    } catch (error) {
      console.error("Parcel status update error:", error);
      return res.status(200).json({ status: 0, msg: "Server error" });
    }
  }

  clearOldEarnings = async (req, res) => {
    try {
      const updatedCount = await this.rider.clearEarningsOlderThan10Minutes();


      return res.json({
        status: 0,
        msg: `${updatedCount} earnings cleared successfully.`

      });
    } catch (error) {
      return res.status(200).json({
        status: 0,
        msg: "Internal Server Error",
        error: error.message,
      });
    }
  };

  addOrUpdateRiderNotes = async (req, res) => {
    const {
      memType,
      notes,
      token,
      order_id
    } = req.body;

    try {
      const rider = await this.validateTokenAndGetMember(token, "rider");
      if (!rider) {
        return res.status(200).json({
          status: 0,
          msg: "Unauthorized access."
        });
      }

      if (!order_id) {
        return res.status(200).json({
          status: 0,
          msg: "Invalid order ID."
        });
      }

      // ✅ Derive rider_id from token result
      const rider_id = rider.user.id;

      await this.rider.addOrUpdateRiderNotes({
        memType,
        notes,
        rider_id,
        order_id
      });

      const encodedId = helpers.doEncode(String(order_id));
      const orderDetails = await this.getCompleteOrderObject(
        rider.user.id,
        order_id,
        encodedId
      );

      return res.json({
        status: 1,
        msg: "Rider Notes saved successfully",
        order: orderDetails
      });

    } catch (error) {
      console.error("Error in addOrUpdateRiderNotes:", error);
      return res.status(200).json({
        status: 0,
        msg: "Server error"
      });
    }
  }







}

module.exports = RiderController;