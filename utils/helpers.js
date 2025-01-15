const fs = require("fs"); // Importing the file system module
const path = require("path"); // Importing the path module
const sanitizeHtml = require("sanitize-html"); // Importing sanitize-html for XSS protection
const validator = require("validator"); // Importing validator for input validation
const crypto = require("crypto"); // Importing crypto for encryption and hashing
const pool = require("../config/db-connection");
const moment = require("moment-timezone");
const { io, users } = require("../app"); // Import io from app.js
const axios = require('axios');


module.exports = {
  // A sample function that formats a status with secure HTML
  getStatus: function (status) {
    if (status === 1) {
      return '<span class="status badge success">Active</span>';
    } else {
      return '<span class="status badge danger">InActive</span>';
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
  // helpers.js or helpers.ts

  formatDateToUK: function (date) {
    // Use moment to parse the date and convert it to UK timezone (Europe/London)
    return moment(date)
      .tz("Europe/London") // Set the timezone to UK (Europe/London)
      .format("D MMMM YYYY"); // Format the date in UK format
  },

  getUtcTimeInSeconds: function () {
    return moment.utc().unix(); // Returns the UTC time in seconds
  },

  convertUtcToUkFormat : function (utcTimeInSeconds) {
    return moment.unix(utcTimeInSeconds).tz("Europe/London").format("DD/MM/YYYY HH:mm:ss"); // UK time format
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
      if (mem_type === "user") {
        const userQuery = `SELECT id, full_name as sender_name, mem_image as sender_dp FROM riders WHERE id = ?`;
        const [userRows] = await pool.query(userQuery, [sender]);
        senderInfo = userRows[0];
      } else if (mem_type === "rider") {
        const riderQuery = `SELECT id, full_name as sender_name, mem_image as sender_dp FROM members WHERE id = ?`;
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
        text: text,
        time: created_date,
        link: link
      };
      // console.log(notificationObject,mem_type)

      // Find all sockets associated with the user_id in the users array
      const userSockets = users.filter((user) => parseInt(user.user_id) === parseInt(user_id) && user?.mem_type===mem_type);
      console.log(users,userSockets,'userSockets')
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
    console.log("Querying address:", address); // Log the address

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
}
};
