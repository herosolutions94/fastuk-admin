const fs = require("fs"); // Importing the file system module
const path = require("path"); // Importing the path module
const sanitizeHtml = require("sanitize-html"); // Importing sanitize-html for XSS protection
const validator = require("validator"); // Importing validator for input validation
const crypto = require("crypto"); // Importing crypto for encryption and hashing
const pool = require("../config/db-connection");
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
  calculateOrderSummary: function(order_details, siteSettings) {
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
  shortText: function(text, length) {
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
    }  else if (status == 'pending') {
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
                SELECT id, name, state_id
                FROM cities ORDER BY name
            `;
      const [rows] = await pool.execute(query);
      // console.log(rows)
      return rows;
    } catch (error) {
      console.error("Error fetching cities:", error.message);
      throw new Error("Could not fetch cities");
    }
  },
  getStatesByCountryId:async function(country_id) {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_states WHERE country_id = ?', [country_id]);
        return rows; // Return fetched states
    } catch (error) {
        console.error('Error fetching states:', error);
        throw error;
    }
},
getStateNameByStateId:async function(state_id) {
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
    // Use moment to parse the date and convert it to UK timezone (Europe/London)
    return moment(date)
      .tz("Europe/London") // Set the timezone to UK (Europe/London)
      .format("D MMMM YYYY"); // Format the date in UK format
  },
  getRiderMessageForAddress: function(array, address) {
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
  convertUtcToUkFormat : function (utcSeconds) {
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




convertUtcToUKTime : function (utcTimeInSeconds) {
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

   formatAmount: function(amount) {
    // Ensure the input is a number
    const numericAmount = parseFloat(amount);
  
    // If the amount is an integer, return it as is
    if (numericAmount % 1 === 0) {
      return numericAmount; // e.g., 10 → 10
    }
  
    // If the amount has decimal points, format it to two decimal places
    return parseFloat(numericAmount.toFixed(2)); // e.g., 10.123 → 10.12
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
        senderInfo.is_admin=1;
      }else if (mem_type === "user" || mem_type === "business") {
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
        id:result.insertId,
        sender_name: senderInfo.sender_name,
        sender_dp: senderInfo.sender_dp,
        is_admin: senderInfo.is_admin,
        text: text,
        time: created_date,
        link: link
      };
      console.log(notificationObject,mem_type)

      // Find all sockets associated with the user_id in the users array
      const userSockets = users.filter((user) => parseInt(user.user_id) === parseInt(user_id) && user?.mem_type===mem_type);
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
getCoordinates : async function (address)  {
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
getDistance : async function (source, destination)  {
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

 storeTransaction: async function(transactionData) {
  const query = `
    INSERT INTO transactions (
      user_id, amount, payment_method, transaction_id, created_time
    ) VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    transactionData.user_id,
    transactionData.amount,
    transactionData.payment_method,
    transactionData.transaction_id,
    transactionData.created_time,
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
 storeWebHookData: async function(transactionData) {
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
getTransaction: async function(user_id) {
  try {
      const [rows] = await pool.query(`SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC`, [user_id]);
      return rows; // Returns true if email exists, false otherwise
  } catch (error) {
      throw new Error(`Error getting transactions!`);
  }
},
generatePromoCode: async function () {
  // Generate a 6-digit number between 100000 and 999999
  const promoCode = crypto.randomInt(100000, 999999);
  
  return promoCode.toString(); // Return as a string
},

 insertEarnings: async function(data) {
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
sendEmail : async function (to, subject, templateName, templateData) {
  try {
    const templatePath = path.join(__dirname, "../views/email-templates", `${templateName}.ejs`);
    let adminData=templateData?.adminData
     if (!adminData) {
          return res.status(200).json({ success: false, message: "Site settings not found" });
        }
        if (adminData) {
            adminData.logo = process.env.BASE_URL+this.getImage(adminData.logo_image);
        }

        // console.log('templateData',templateData)
        // Render the EJS template with dynamic data
        const htmlContent = await ejs.renderFile(templatePath, templateData);
      const info = await transporter.sendMail({
          from: `${templateData?.adminData?.site_name} <${'noreply@fastukcouriers.com'}>`, // Sender
          to,      // Receiver email(s)
          subject, // Subject line
          html:htmlContent   // HTML body
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






};
