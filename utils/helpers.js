const fs = require("fs"); // Importing the file system module
const path = require("path"); // Importing the path module
const sharp = require("sharp");
const sanitizeHtml = require("sanitize-html"); // Importing sanitize-html for XSS protection
const validator = require("validator"); // Importing validator for input validation
const crypto = require("crypto"); // Importing crypto for encryption and hashing
const pool = require("../config/db-connection");
const RequestQuoteModel = require("../models/request-quote");

const moment = require("moment-timezone");
const { io, users } = require("../app"); // Import io from app.js
const axios = require('axios');
const nodemailer = require("nodemailer");
const mime = require("mime-types");
require('dotenv').config(); // Load environment variables
const ejs = require("ejs");




const transporter = nodemailer.createTransport({

  host: process.env.SMTP_HOST,  // Replace with your SMTP host
  port: process.env.SMTP_PORT,                 // Common ports: 465 (SSL), 587 (TLS)
  secure: false,             // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL,  // Replace with your email
    pass: process.env.SMTP_PASSWORD      // Replace with your email password
  }


});

module.exports = {
  transporter,
  // A sample function that formats a status with secure HTML
  //   sendMailgunEmail:async function (to, subject, text, html) {
  //   try {

  //     // Configure Mailgun SMTP transporter
  //     const transporter = nodemailer.createTransport({
  //       host: process.env.SMTP_MAILGUN_HOST,
  //       port: process.env.SMTP_MAILGUN_PORT, // Use 465 for SSL or 587 for TLS
  //       secure: false, // Set true for port 465, false for others
  //       auth: {
  //         user: process.env.SMTP_MAILGUN_USERNAME, // Replace with your Mailgun SMTP username
  //         pass: process.env.SMTP_MAILGUN_PASSWORD, // Replace with your Mailgun SMTP password
  //       },
  //     });

  //     // Email options
  //     const mailOptions = {
  //       from: 'FASTUK <postmaster@fastukcouriers.com>',
  //       to,
  //       subject,
  //       text, // Plain text body
  //       html, // HTML body
  //     };

  //     // Send email
  //     const info = await transporter.sendMail(mailOptions);
  //     console.log("Email sent:", info.messageId);
  //     return info;
  //   } catch (error) {
  //     console.error("Error sending email:", error);
  //     throw error;
  //   }
  // },
  getUniqueAddresses: function (data) {
    const allAddresses = [];

    data.forEach(item => {
      allAddresses.push({
        address: item.source_address,
        lat: item.source_lat,
        lng: item.source_lng
      });
      allAddresses.push({
        address: item.destination_address,
        lat: item.destination_lat,
        lng: item.destination_lng
      });
    });

    // Remove duplicates
    const unique = allAddresses.filter(
      (addr, index, self) =>
        index === self.findIndex(
          a => a.address === addr.address && a.lat === addr.lat && a.lng === addr.lng
        )
    );

    // Sort alphabetically by address (you can change this to lat/lng if needed)
    unique.sort((a, b) => a.address.localeCompare(b.address));

    return unique;
  },
  getOptimizedAddresses: async function (addresses) {
    if (!addresses || addresses.length < 2) {
      throw new Error("At least 2 addresses required");
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const origin = addresses[0]; // first = start
    const destination = addresses[addresses.length - 1]; // last = end
    const waypoints = addresses.slice(1, -1); // middle points

    const url = "https://maps.googleapis.com/maps/api/directions/json";

    const response = await axios.get(url, {
      params: {
        origin,
        destination,
        waypoints: `optimize:true|${waypoints.join("|")}`,
        key: apiKey,
      },
    });

    const data = response.data;
    if (!data.routes || data.routes.length === 0) {
      throw new Error("No routes found");
    }

    const route = data.routes[0];
    const optimizedOrder = route.waypoint_order;

    // Build final ordered addresses
    const sortedAddresses = [
      origin,
      ...optimizedOrder.map((i) => waypoints[i]),
      destination,
    ];

    // Add order_number
    return sortedAddresses.map((addr, index) => ({
      address: addr,
      order_number: index + 1,
    }));
  },
  getRequestOrderStatus: function (status) {
    if (status === 'accepted') {
      return 'Accepted';
    } else if (status === 'on-way-pickup') {
      return 'On way to (Collection/pickup)';
    } else if (status === 'on-site-pickup') {
      return 'On site (collection/pickup)';
    } else if (status === 'loaded') {
      return 'Loaded';
    } else if (status === 'on-site-delivery') {
      return 'On site (delivery/destination)';
    } else if (status === 'delivered') {
      return 'Delivered';
    } else {
      return 'Active';
    }
  },
  getRequestOrderStatusText: function (status) {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'on-way-pickup': return 'On way to (Collection/pickup)';
      case 'on-site-pickup': return 'On site (collection/pickup)';
      case 'loaded': return 'Loaded';
      case 'on-site-delivery': return 'On site (delivery/destination)';
      case 'delivered': return 'Delivered';
      default: return 'Active';
    }
  }
  ,
  updateRequestStatus: async function (id, status) {
    const query = `UPDATE request_quote SET status = ?, request_status = ? WHERE id = ?`;
    const values = [status, status, id];
    try {
      const [result] = await pool.query(query, values);

      if (result.affectedRows === 0) {
        return null; // No rows updated, possibly because the ID doesn't exist
      }
      return true; // Return the updated status and ID    } catch (error) {
    } catch (error) {
      throw new Error('Error updating request quote status: ' + error.message);
    }
  },

  timesAgo: function (utcSeconds) {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const elapsed = now - utcSeconds; // Time difference in seconds

    if (elapsed < 60) return `${elapsed} seconds ago`; // Less than a minute
    const minutes = Math.floor(elapsed / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`; // Less than an hour
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`; // Less than a day
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`; // Less than a week
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`; // Less than a month
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`; // Less than a year
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`; // More than a year
  },

  format_amount: function (amount) {
    amount = String(amount);

    // Ensure always 2 decimals but without rounding
    if (amount.includes(".")) {
      let [int, dec] = amount.split(".");
      dec = dec.substring(0, 2); // take only first 2 digits, NO ROUNDING
      return `£${int}.${dec.padEnd(2, "0")}`;
    } else {
      return `£${amount}.00`;
    }
  }
  ,

  updateRequestQuoteJobStatus: async function (orderId) {

    const dueAmount = await RequestQuoteModel.calculateDueAmount(orderId);
    console.log("dueAmount:", dueAmount);


    // 0. Fetch current job status first
    const [rqRows] = await pool.query(
      "SELECT status FROM request_quote WHERE id = ?",
      [orderId]
    );

    if (!rqRows || rqRows.length === 0) return;
    const currentStatus = rqRows[0].status;
    console.log("currentStatus:", currentStatus);

    // 1. Fetch all stages for this order
    const [stages] = await pool.query(
      "SELECT id, status FROM order_stages WHERE order_id = ? ORDER BY id ASC",
      [orderId]
    );
    console.log("stages:", stages);

    if (!stages || stages.length === 0) return;

    // 2. Determine stage progress
    const hasStarted = stages.some(s => s.status !== "pending");
    const allCompleted = stages.every(s => s.status === "completed");

    console.log(hasStarted, allCompleted)

    let newStatus = currentStatus;

    // **********************************************
    // ⭐ YOUR NEW CONDITION
    // If job is accepted, all stages completed, but payment pending → pending_payment
    // **********************************************
    // 3. Determine new status
    if (
      currentStatus === "accepted" &&
      allCompleted &&
      dueAmount > 0
    ) {
      newStatus = "pending_payment";
    }

    else if (allCompleted && dueAmount === 0 && currentStatus === 'completed') {
      newStatus = "completed";
    }

    // ⭐ IMPORTANT FIX: If job is accepted but not started → keep it "accepted"
    else if (currentStatus === "accepted" && !hasStarted) {
      newStatus = "accepted";
    }

    else if (hasStarted) {
      newStatus = "in_progress";
    }

    else {
      newStatus = "new";
    }


    // if (newStatus !== currentStatus) {
    //     // 4. Update the job status in request_quote
    //     await pool.query(
    //         "UPDATE request_quote SET status = ? WHERE id = ?",
    //         [newStatus, orderId]
    //     );
    // }

    return newStatus; // return updated status
  }


  ,
  calculateOrderSummary: function (order_details, siteSettings) {
    try {
      // Parse the input as an array
      const parcelsArr = JSON.parse(order_details);
      // console.log(parcelsArr);return;
      // Parse each element inside the array
      let totalDistance = 0;
      let totalAmount = 0;

      parcelsArr.forEach(parcel => {
        const distance = parseFloat(parcel.distance) || 0;
        const price = parseFloat(parcel.price) || 0;

        totalDistance += distance;
        totalAmount += distance * price;
      });

      const taxPercentage = parseFloat(siteSettings?.site_processing_fee || 0);
      const taxAmount = (totalAmount * taxPercentage) / 100;
      const grandTotal = totalAmount + taxAmount;

      return {
        totalDistance,
        totalAmount,
        taxAmount,
        grandTotal
      };
    } catch (error) {
      console.error("Error parsing order_details JSON:", error.message);
      return {
        error: "Invalid JSON format for order_details",
        tax: 0,
        total: 0,
      };
    }

  },
  calculateOrderTotal: function (totalDistance, siteSettings, price, remote_price) {
    try {
      let totalAmount = parseFloat(price) * parseFloat(totalDistance);
      if (remote_price === null || remote_price === 'null' || remote_price === '' || remote_price === undefined) {
        remote_price = 0;
      }
      totalAmount = totalAmount + remote_price;

      const taxPercentage = parseFloat(siteSettings?.site_processing_fee || 0);
      const taxAmount = (totalAmount * taxPercentage) / 100;
      const grandTotal = totalAmount + taxAmount;
      console.log("Total Amount:", totalAmount);

      return {
        totalDistance,
        totalAmount: totalAmount.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2)
      };
    } catch (error) {
      console.error("Error parsing order_details JSON:", error.message);
      return {
        error: "Invalid JSON format for order_details",
        tax: 0,
        total: 0,
      };
    }

  },

  getStatus: function (status) {
    if (parseInt(status) === 1) {
      return '<span class="status badge success">Active</span>';
    } else {
      return '<span class="status badge danger">InActive</span>';
    }
  },
  getEarningStatus: function (status) {
    if (status === 'cleared') {
      return '<span class="status badge success">Cleared</span>';
    } else {
      return '<span class="status badge warning">Pending</span>';
    }
  },
  shortText: function (text, length) {
    if (!text || typeof text !== "string") return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  },
  uploadImageFromUrl: async function (imageUrl) {
    try {
      // Define uploads folder in the main project directory
      const uploadsDir = path.resolve(__dirname, "../uploads");

      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Fetch the image
      const response = await axios({
        url: imageUrl,
        responseType: "stream",
      });

      // Get the correct file extension
      const contentType = response.headers["content-type"];
      const extension = mime.extension(contentType) ? `.${mime.extension(contentType)}` : ".jpg"; // Default to .jpg if unknown

      // Generate a unique encrypted filename
      const encryptedName = crypto.randomBytes(16).toString("hex") + extension;
      const filePath = path.join(uploadsDir, encryptedName);

      // Save the image
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          // const fullUrl = `${BASE_URL}/${encryptedName}`;
          resolve({ imageName: encryptedName, extension });
        });
        writer.on("error", reject);
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },
  getDocumentStatus: function (status) {
    if (status == 'rejected') {
      return '<span class="status badge danger">Rejected</span>';
    } else if (status == 'pending') {
      return '<span class="status badge warning">Pending</span>';

    } else if (status == 'approved') {
      return '<span class="status badge success">Approved</span>';
    } else {
      return '<span class="status badge warning">Requested</span>';
    }
  },
  getRiderApprovalStatus: function (status) {
    if (status == 'rejected') {
      return '<span class="status badge danger">Rejected</span>';
    } else if (status == 'approved') {
      return '<span class="status badge success">Approved</span>';
    } else {
      return '<span class="status badge warning">Pending</span>'; // Default case
    }
  },

  getBusinessUserApprovalStatus: function (status) {
    if (status == 'rejected') {
      return '<span class="status badge danger">Rejected</span>';
    } else if (status == 'approved') {
      return '<span class="status badge success">Approved</span>';
    } else {
      return '<span class="status badge warning">Pending</span>'; // Default case
    }
  },

  calculateParcelsPrice: function (order_details, site_processing_fee) {
    let orderDetails;
    // console.log(order_details,'order_details')
    try {
      // Parse the input as an array
      const parsedArray = JSON.parse(order_details);
      // console.log(parsedArray,'parsedArray')
      // Parse each element inside the array
      orderDetails = parsedArray;
    } catch (error) {
      console.error("Error parsing order_details JSON:", error.message);
      return {
        error: "Invalid JSON format for order_details",
        tax: 0,
        total: 0,
      };
    }

    // Ensure the parsed data is an array
    if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
      return {
        tax: 0,
        total: 0,
      };
    }

    // console.log(orderDetails, site_processing_fee);

    // Use reduce to accumulate the total sum
    const totalSum = orderDetails.reduce((total, parcel) => {
      // Parse `distance` to a float since it is stored as a string
      const distance = parseFloat(parcel.distance) || 0;
      const price = parseFloat(parcel.price) || 0;

      // Add the product of price and distance to the total
      return total + price * distance;
    }, 0);

    // Get the tax percentage from siteSettings
    const taxPercentage = parseFloat(site_processing_fee || 0);

    // Calculate tax and grand total
    const taxAmount = (totalSum * taxPercentage) / 100;
    const grandTotal = totalSum + taxAmount;

    return {
      tax: taxAmount,
      total: grandTotal,
    };
  },

  getVerifiedStatus: function (status) {
    if (status === 1) {
      return '<span class="status badge success">Verified</span>';
    } else {
      return '<span class="status badge danger">UnVerified</span>';
    }
  },

  convertUtcSecondsToUKTime: function (utcSeconds) {
    // Convert seconds to milliseconds
    const date = new Date(utcSeconds * 1000);

    // Convert to UK time (Europe/London timezone)
    return date.toLocaleTimeString('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit'
    });
  },


  // Function to capitalize text
  capitalize: function (text) {
    return validator.isString(text)
      ? text.charAt(0).toUpperCase() + text.slice(1)
      : text;
  },

  // Function to get an image URL or return a default image if none is provided
  getImage: function (
    imageName,
    defaultImage = "/uploads/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.avif"
  ) {
    if (!imageName) {
      return defaultImage;
    }

    // Sanitize and remove any unsafe characters
    imageName = sanitizeHtml(imageName.replace(/^\/+|^uploads\//, ""), {
      allowedTags: [],
      allowedAttributes: {}
    });

    // Construct the full image path
    const imagePath = path.join(__dirname, "..", "uploads", imageName);

    // Check if the image exists
    if (fs.existsSync(imagePath)) {
      return `/uploads/${imageName}`;
    } else {
      console.log("Image does not exist, returning default image");
      return defaultImage;
    }
  },

  // Function to sanitize individual input
  sanitizeInput: function (input) {
    if (typeof input === "string") {
      // Allow limited HTML tags if input is expected to have HTML (e.g., from rich text editors)
      return sanitizeHtml(input, {
        allowedTags: [
          "p",
          "b",
          "i",
          "strong",
          "em",
          "ul",
          "ol",
          "li",
          "a",
          "h1",
          "h2",
          "h3"
        ],
        allowedAttributes: { a: ["href"] },
        allowedSchemes: ["http", "https", "mailto"]
      }).trim();
    }
    return input;
  },

  // Function to validate and sanitize data (recursive for nested objects)
  sanitizeData: function (input) {
    if (typeof input === "string") {
      return input.trim();
    }
    return input;
  },

  // Function to validate commonly required types
  validateInput: function (input, type) {
    switch (type) {
      case "email":
        return validator.isEmail(input) ? input : null;
      case "url":
        return validator.isURL(input, {
          protocols: ["http", "https"],
          require_protocol: true
        })
          ? input
          : null;
      case "integer":
        return validator.isInt(input.toString()) ? parseInt(input, 10) : null;
      case "float":
        return validator.isFloat(input.toString()) ? parseFloat(input) : null;
      case "boolean":
        return typeof input === "boolean"
          ? input
          : validator.toBoolean(input.toString());
      case "text":
        return validator.isString(input) ? validator.escape(input) : null;
      default:
        return input;
    }
  },

  // Function to sanitize and validate all fields in an object based on type
  sanitizeAndValidateData: function (data, schema) {
    const validatedData = {};
    Object.keys(schema).forEach((key) => {
      const type = schema[key];
      validatedData[key] = this.validateInput(
        this.sanitizeInput(data[key]),
        type
      );
    });
    return validatedData;
  },

  create_current_date: function () {
    const now = new Date();

    // Extract components in UK timezone
    const options = { timeZone: "Europe/London", hour12: false };
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    // Format date and time components
    const parts = formatter.formatToParts(now);
    const year = parts.find((part) => part.type === "year").value;
    const month = parts.find((part) => part.type === "month").value;
    const day = parts.find((part) => part.type === "day").value;
    const hour = parts.find((part) => part.type === "hour").value;
    const minute = parts.find((part) => part.type === "minute").value;
    const second = parts.find((part) => part.type === "second").value;

    // Return the formatted date-time string
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  },

  // Generate a secure, encrypted token
  generateToken: function (userId, tokenType) {
    const randomNum = crypto.randomBytes(16).toString("hex");
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const plainTextToken = `${randomNum}-${tokenType}-${userId}-${expiryDate.toISOString()}`;
    const key = crypto.randomBytes(32); // Key for AES encryption (securely store this)
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encryptedToken = cipher.update(plainTextToken, "utf8", "hex");
    encryptedToken += cipher.final("hex");

    return `${encryptedToken}:${iv.toString("hex")}:${key.toString("hex")}`;
  },

  // Decrypt the secure token
  decryptToken: function (encryptedTokenWithIvKey) {
    const [encryptedToken, ivHex, keyHex] = encryptedTokenWithIvKey.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = Buffer.from(keyHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedToken, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  },

  getCities: async function () {
    try {
      const query = `
      SELECT DISTINCT name
      FROM cities
      
      ORDER BY LOWER(name) ASC
    `;

      const [rows] = await pool.execute(query);
      // console.log(rows)
      return rows;
    } catch (error) {
      console.error("Error fetching cities:", error.message);
      throw new Error("Could not fetch cities");
    }
  },
  getStatesByCountryId: async function (country_id) {
    try {
      const [rows] = await pool.query('SELECT * FROM tbl_states WHERE country_id = ?', [country_id]);
      return rows; // Return fetched states
    } catch (error) {
      console.error('Error fetching states:', error);
      throw error;
    }
  },
  getStateNameByStateId: async function (state_id) {
    try {
      const [rows] = await pool.query('SELECT * FROM tbl_states WHERE id = ?', [state_id]);
      return rows?.length > 0 ? rows[0]?.name : null; // Return fetched states
    } catch (error) {
      console.error('Error fetching states:', error);
      throw error;
    }
  },
  // helpers.js or helpers.ts

  formatDateToUK: function (date) {
    return moment(date)
      .tz("Europe/London")  // ensure it's in UK timezone
      .format("DD/MM/YYYY"); // ✅ UK format
  },

  getRiderMessageForAddress: function (array, address) {
    return array
      .map((obj) => {
        if (obj.source_address === address) {
          return `Picked-up Location: Parcel Number ${obj.parcel_number} will be picked from ${obj.source_address}`;
        } else if (obj.destination_address === address) {
          return `Drop-off Location: Parcel Number ${obj.parcel_number} will be dropped at ${obj.destination_address}`;
        }
        return null; // Return null if the address is not found
      })
      .filter((message) => message !== null);
  },

  getUtcTimeInSeconds: function () {
    return moment.utc().unix(); // Returns the UTC time in seconds
  },
  convertUtcToUkFormat: function (utcSeconds) {
    const date = new Date(utcSeconds * 1000); // Convert seconds to milliseconds

    // UK date-time format: DD/MM/YYYY HH:mm:ss
    const ukFormattedDate = date.toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Use 24-hour format
    });

    return ukFormattedDate;
  },
  addTwoDaysToDate: function () {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 2);
    console.log("currentDate:", currentDate)
    return currentDate;
  },


  convertUtcToUKTime: function (utcTimeInSeconds) {
    return moment.unix(utcTimeInSeconds).tz("Europe/London").format("DD/MM/YYYY"); // UK time format
  },
  toUKDateFormat: function (dateInput) {
    // Ensure the input is a Date object
    const date = new Date(dateInput);

    // Check if the date is valid
    if (isNaN(date)) {
      throw new Error("Invalid date provided.");
    }

    // Extract day, month, and year
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();

    // Return in DD/MM/YYYY format
    return `${day}/${month}/${year}`;
  },

  doEncode: function (input, key = "preciousprotection") {
    // Ensure input is a string
    const string = String(input);

    let hash = "";
    const base64String = Buffer.from(string).toString("base64");
    const shaKey = crypto.createHash("sha1").update(key).digest("hex");
    const strLen = base64String.length;
    const keyLen = shaKey.length;
    let j = 0;

    for (let i = 0; i < strLen; i++) {
      const ordStr = base64String.charCodeAt(i);
      if (j === keyLen) j = 0;
      const ordKey = shaKey.charCodeAt(j);
      j++;
      const encodedChar = Number(ordStr + ordKey).toString(16); // Convert to hex
      hash += [...encodedChar].reverse().join(""); // Reverse and add to hash
    }

    return hash;
  },

  doDecode: function (string, key = "preciousprotection") {
    let hash = "";
    const shaKey = crypto.createHash("sha1").update(key).digest("hex");
    const strLen = string.length;
    const keyLen = shaKey.length;
    let j = 0;

    for (let i = 0; i < strLen; i += 2) {
      const revHex = [...string.substr(i, 2)].reverse().join(""); // Reverse 2-character substring
      const ordStr = parseInt(revHex, 16); // Convert back from hex
      if (j === keyLen) j = 0;
      const ordKey = shaKey.charCodeAt(j);
      j++;
      hash += String.fromCharCode(ordStr - ordKey); // Decode character
    }

    const decodedString = Buffer.from(hash, "base64").toString();
    return decodedString;
  },


  formatAmount: function (amount) {
    // Convert input safely to a float
    const numericAmount = Number(amount);

    // Handle invalid values
    if (isNaN(numericAmount)) return "0";

    // If it's an integer
    if (Number.isInteger(numericAmount)) {
      return numericAmount.toString(); // Keep as whole number
    }

    // Otherwise, format to two decimals
    return numericAmount.toFixed(2);
  },


  insertData: async function (table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO \`${table}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES (${placeholders})`;

    const [result] = await pool.execute(sql, values);
    return result;
  },
  storeNotification: async function (user_id, mem_type, sender, text, link = null) {
    // console.log("hi",users)
    try {
      // Prepare the query for inserting the notification
      const insertQuery = `
            INSERT INTO notifications (user_id, mem_type, sender, text, status, created_date, link)
            VALUES (?, ?, ?, ?, 0, ?, ?)
        `;

      // Get the current UTC timestamp
      const created_date = this.getUtcTimeInSeconds();

      // Insert the notification into the database
      const [result] = await pool.query(insertQuery, [
        user_id,
        mem_type,
        sender,
        text,
        created_date,
        link
      ]);

      // Check if the notification was successfully inserted
      if (result.affectedRows !== 1) {
        throw new Error("Failed to insert notification");
      }

      // Fetch the inserted notification's row
      const fetchQuery = `SELECT * FROM notifications WHERE id = ?`;
      const [notificationRows] = await pool.query(fetchQuery, [
        result.insertId
      ]);
      const notification = notificationRows[0];

      // Fetch sender details based on mem_type
      let senderInfo = null;
      if (sender === 0) {
        // Fetch sender info from site settings if sender is 0
        const siteSettingsQuery = `SELECT site_name as sender_name, logo_image as sender_dp FROM tbl_admin LIMIT 1`;
        const [siteSettingsRows] = await pool.query(siteSettingsQuery, [sender]);
        senderInfo = siteSettingsRows[0];
        senderInfo.is_admin = 1;
      } else if (mem_type === "user" || mem_type === "business") {
        const userQuery = `SELECT id, full_name as sender_name, mem_image as sender_dp FROM riders WHERE id = ?`;
        const [userRows] = await pool.query(userQuery, [sender]);
        senderInfo = userRows[0];
      } else if (mem_type === "rider") {
        const riderQuery = `SELECT id, full_name as sender_name, mem_image as sender_dp FROM members WHERE id = ?`;
        // console.log(riderQuery,sender);
        const [riderRows] = await pool.query(riderQuery, [sender]);
        senderInfo = riderRows[0];
      }

      if (!senderInfo) {
        throw new Error("Sender information not found");
      }

      // Prepare the notification object
      const notificationObject = {
        id: result.insertId,
        sender_name: senderInfo.sender_name,
        sender_dp: senderInfo.sender_dp,
        is_admin: senderInfo.is_admin,
        text: text,
        time: created_date,
        link: link
      };
      console.log(notificationObject, mem_type)

      // Find all sockets associated with the user_id in the users array
      const userSockets = users.filter((user) => parseInt(user.user_id) === parseInt(user_id) && user?.mem_type === mem_type);
      // console.log(users,userSockets,'userSockets')
      // Loop through each socket entry and emit the notification
      userSockets.forEach((userSocket) => {
        io.to(userSocket.socket).emit(
          "receive-notification",
          notificationObject
        );
      });
      console.log(
        `Notification sent to ${userSockets.length} sockets for user_id ${user_id}`
      );
      return true;
    } catch (error) {
      console.error("Error storing notification:", error.message);
      throw error;
    }
  },
  // Helper function to get latitude and longitude from an address using Nominatim API
  getCoordinates: async function (address) {
    try {
      // console.log("Querying address:", address); // Log the address

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const response = await axios.get(url);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return { lat, lon };
      } else {
        throw new Error("Address not found.");
      }
    } catch (error) {
      console.error("Error getting coordinates:", error);
      throw error;
    }
  },

  // Helper function to calculate distance using OSRM API
  getDistance: async function (source, destination) {
    try {
      const sourceCoords = await this.getCoordinates(source);
      const destinationCoords = await this.getCoordinates(destination);

      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${sourceCoords.lon},${sourceCoords.lat};${destinationCoords.lon},${destinationCoords.lat}?overview=false&steps=false`;

      const response = await axios.get(osrmUrl);
      if (response.data.routes && response.data.routes.length > 0) {
        const distance = response.data.routes[0].distance; // Distance in meters
        return distance;
      } else {
        throw new Error("No route found.");
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      throw error;
    }
  },

  storeTransaction: async function (transactionData) {
    // console.log("Transaction Data:", transactionData);
    const query = `
    INSERT INTO transactions (
      user_id, amount, payment_method, transaction_id, created_time, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

    const values = [
      transactionData.user_id,
      transactionData.amount,
      transactionData.payment_method,
      // transactionData.transaction_id ? parseInt(transactionData.transaction_id, 10) : null,
      transactionData.transaction_id && !isNaN(transactionData.transaction_id)
        ? parseInt(transactionData.transaction_id, 10)
        : null,
      transactionData.created_time,
      transactionData.status,
    ];

    try {
      const [result] = await pool.query(query, values);
      // console.log('Transaction Data:', transactionData); // Debugging

      // console.log(`Transaction stored successfully. Insert ID: ${result.insertId}`);
    } catch (error) {
      console.error('Error storing transaction:', error.message);
      throw new Error('Database query failed.');
    }
  },
  storeWebHookData: async function (transactionData) {
    const query = `
    INSERT INTO webhooks (
      type, response
    ) VALUES (?, ?)
  `;

    const values = [
      transactionData.type,
      transactionData.response,
    ];

    try {
      const [result] = await pool.query(query, values);
      // console.log('Transaction Data:', transactionData); // Debugging

      // console.log(`Transaction stored successfully. Insert ID: ${result.insertId}`);
    } catch (error) {
      console.error('Error storing transaction:', error.message);
      throw new Error('Database query failed.');
    }
  },
  getTransaction: async function (user_id) {
    try {
      const [rows] = await pool.query(`SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC`, [user_id]);
      return rows; // Returns true if email exists, false otherwise
    } catch (error) {
      throw new Error(`Error getting transactions!`);
    }
  },
  generatePromoCode: async function () {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let promoCode = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      promoCode += chars[randomIndex];
    }

    return promoCode;
  },


  insertEarnings: async function (data) {
    try {
      const query = `
      INSERT INTO earnings (user_id, amount, type, status, created_time)
      VALUES (?, ?, ?, ?, ?)
      `;
      const values = [
        data.user_id,
        data.amount,
        data.type,
        data.status,
        data.created_time,
      ];
      const result = await pool.query(query, values);
      // console.log("Full Query Result:", result);

      return result; // Return the inserted row
    } catch (error) {
      console.error("Error inserting earnings:", error);
      return null;
    }
  },

  // Function to send an email
  sendEmail: async function (to, subject, templateName, templateData) {
    try {
      const templatePath = path.join(__dirname, "../views/email-templates", `${templateName}.ejs`);
      let adminData = templateData?.adminData
      if (!adminData) {
        return res.status(200).json({ success: false, message: "Site settings not found" });
      }
      if (adminData) {
        adminData.logo = process.env.BASE_URL + this.getImage(adminData.logo_image);
      }

      // console.log('templateData',templateData)
      // Render the EJS template with dynamic data
      const htmlContent = await ejs.renderFile(templatePath, templateData);
      const info = await transporter.sendMail({
        from: `${templateData?.adminData?.site_name} <${'noreply@fastukcouriers.com'}>`, // Sender
        to,      // Receiver email(s)
        subject, // Subject line
        html: htmlContent   // HTML body
      });
      // console.log("Email sent: ", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email sending failed: ", error);
      return { success: false, error };
    }
  },

  isAdmin: async function (req) {
    return req.session && req.session.admin && req.session.admin.type === 'admin';
  },

  hasAccess: async function (req, permissionId = 0) {
    if (await this.isAdmin(req)) return true; // ✅ Ensure true for admins

    let permissions = req.session.permissions || [];
    permissions = permissions.map(p => parseInt(p, 10)).filter(Number.isInteger);

    // console.log("Checking permission:", permissionId, "User permissions:", permissions);
    return permissions.includes(permissionId);
  },

  access: async function (req, permissionId) {
    if (await this.isAdmin(req)) return true; // ✅ Ensure true for admins

    const permissions = req.session.permissions || [];
    return permissions.includes(permissionId.toString());
  },
  getDataFromDB: async function (table, conditions) {
    try {
      const keys = Object.keys(conditions);
      const values = Object.values(conditions);

      const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
      const query = `SELECT * FROM ${table} WHERE ${whereClause}`;

      const [rows] = await pool.query(query, values);
      return rows;
    } catch (err) {
      console.error('DB Error:', err);
      return [];
    }
  },

  // getCount: async function (table, whereCondition, values) {
  //   try {
  //       const query = `SELECT COUNT(*) AS count FROM ${table} WHERE ${whereCondition}`;
  //       const [result] = await pool.query(query, values);
  //       return result[0].count; 
  //   } catch (error) {
  //       console.error(`Error fetching count from ${table}:`, error);
  //       throw error;
  //   }
  // }

  getSourceAttachments: async function (request_id) {
    const query = `
    SELECT * 
    FROM request_quote_attachments 
    WHERE request_id = ? AND type = 'source' 
    ORDER BY id ASC
  `;
    const [rows] = await pool.query(query, [request_id]);
    return rows;
  },

  convertToPostgresDate: function (dateString) {
    console.log('date string', dateString);
    if (!dateString) {
      console.log("❗ No date string provided:", dateString);
      return null;
    }

    let day, month, year;

    if (dateString.includes('/')) {
      // Handle DD/MM/YYYY
      [day, month, year] = dateString.split('/');
    } else if (dateString.includes('-')) {
      // Handle YYYY-MM-DD
      [year, month, day] = dateString.split('-');
    } else {
      console.log("❌ Unknown date format:", dateString);
      return null;
    }

    // const [day, month, year] = dateString.split('/');
    // if (!day || !month || !year) {
    //   console.log("❌ Invalid date format:", dateString);
    //   return null;
    // }

    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) {
      console.log("❌ Still an invalid date:", dateString);
      return null;
    }

    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log("✅ Parsed date:", formattedDate);
    return formattedDate; // PostgreSQL DATE format: 'YYYY-MM-DD'
  },

  // convertToPostgresTime: function (timeString, date) {
  //   console.log('time string:', timeString);
  //   console.log('date string:', date);

  //   if (!timeString || !date) {
  //     console.log("❗ Missing time or date input");
  //     return null;
  //   }

  //   // Parse and normalize time
  //   const normalized = timeString.trim().toUpperCase();
  //   const timeParts = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  //   if (!timeParts) {
  //     console.log("❌ Invalid time format:", timeString);
  //     return null;
  //   }

  //   let [ , hour, minute, period ] = timeParts;
  //   hour = parseInt(hour, 10);
  //   minute = parseInt(minute, 10);

  //   if (period === "PM" && hour !== 12) hour += 12;
  //   if (period === "AM" && hour === 12) hour = 0;

  //   const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

  //   // Convert date to YYYY-MM-DD format
  //   const [day, month, year] = date.split('/');
  //   if (!day || !month || !year) {
  //     console.log("❌ Invalid date format:", date);
  //     return null;
  //   }

  //   const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  //   const timestamp = `${formattedDate} ${formattedTime}`;
  //   console.log("✅ Combined TIMESTAMP:", timestamp);

  //   return timestamp; // PostgreSQL TIMESTAMP format: 'YYYY-MM-DD HH:MM:SS'
  // },

  convertToPostgresTime: function (timeString, date) {
    console.log('time string:', timeString);
    console.log('date string:', date);

    if (!timeString || !date) {
      console.log("❗ Missing time or date input");
      return null;
    }

    // Parse and normalize time (e.g., "04:15 pm" -> "16:15:00")
    const normalized = timeString.trim().toUpperCase();
    const timeParts = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (!timeParts) {
      console.log("❌ Invalid time format:", timeString);
      return null;
    }

    let [, hour, minute, period] = timeParts;
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

    // Handle both "DD/MM/YYYY" and "YYYY-MM-DD"
    let day, month, year;
    if (date.includes('/')) {
      [day, month, year] = date.split('/');
    } else if (date.includes('-')) {
      [year, month, day] = date.split('-');
    } else {
      console.log("❌ Unknown date format:", date);
      return null;
    }

    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const timestamp = `${formattedDate} ${formattedTime}`;

    console.log("✅ Combined TIMESTAMP:", timestamp);
    return timestamp; // PostgreSQL TIMESTAMP format: 'YYYY-MM-DD HH:MM:SS'
  },

  combineDateTime: function (date, time) {
    if (!date || !time) return null;
    return `${date} ${time}`; // 'YYYY-MM-DD HH:MM:SS'
  },

  extractDate: function (isoString) {
    return isoString ? isoString.split("T")[0] : null;
  },
  formatTimestamp: function (isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  },
  formatUKTime: function (dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24-hour format
    });
  },


  unwrapJsonString: function (value) {
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  },

  /**
   * Generate a thumbnail for an image
   * @param {string} imageName - The image file name (e.g. 'photo.jpg')
   * @param {string} sourceDir - The path where the original image is located
   * @param {string} thumbFolder - The folder name where the thumbnail should be stored
   * @param {number} width - Desired width of thumbnail
   * @param {number} height - Desired height of thumbnail
   * @returns {Promise<string>} - Path to generated thumbnail
   */

  generateThumbnail: async function (imageName, sourceDir, thumbFolder, width, height) {
    try {
      const imagePath = path.join(sourceDir, imageName);

      // ✅ Check if source image exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image not found: ${imagePath}`);
      }

      const thumbDir = path.join(sourceDir, thumbFolder);

      // ✅ Create thumbnail folder if it doesn't exist
      if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir, { recursive: true });
        console.log(`Created thumbnail folder: ${thumbDir}`);
      }

      const thumbPath = path.join(thumbDir, imageName);
      const ext = path.extname(imageName).toLowerCase();

      // ✅ If SVG → just copy it instead of resizing
      if (ext === '.svg') {
        fs.copyFileSync(imagePath, thumbPath);
        console.log(`SVG file copied to thumbnail folder: ${thumbPath}`);
        return thumbPath;
      }


      // ✅ Generate thumbnail
      await sharp(imagePath)
        .resize(width, height, {
          fit: "inside", // keeps full image, scales down only if larger
          withoutEnlargement: true, // avoids enlarging small images
        })
        .toFile(thumbPath);


      console.log(`Thumbnail generated: ${thumbPath}`);
      return thumbPath;
    } catch (err) {
      console.error("Error generating thumbnail:", err.message);
      throw err;
    }
  }


};


