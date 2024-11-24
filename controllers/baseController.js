const helpers = require("../utils/helpers");
const TokenModel = require('../models/tokenModel');
const MemberModel = require('../models/memberModel');
const RiderModel = require('../models/riderModel');
const tokenModel = new TokenModel();
const memberModel = new MemberModel();
const riderModel = new RiderModel();
const crypto = require('crypto'); // Importing crypto for encryption and hashing

// controllers/BaseController.js
class BaseController {
    constructor() {
        // You can initialize any common properties here if needed
    }
    async storeAndReturnToken(userId, memType,actualFingerprint) {
        const randomNum = crypto.randomBytes(16).toString("hex");
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
          const authToken = helpers.generateToken(
            `${userId}-${randomNum}-${memType}`
          );
          await this.tokenModel.storeToken(
            userId,
            authToken,
            memType,
            expiryDate,
            actualFingerprint,
            "user"
          );
          return authToken;
    }
    async validateTokenAndGetMember(token, memType) {
      if (!token) {
          return { status: 0, msg: "Token is required." };
      }
  
      try {
        //   console.log(token)
          const tokenRecord = await tokenModel.findByToken(token);
          console.log("tokenRecord:",tokenRecord)
          if (!tokenRecord) {
              return { status: 0, msg: "Invalid or expired token." };
          }
  
          const { type: tokenType, user_id: userId, expiry_date: expiryDate } = tokenRecord;
  
          // Check if token has expired
          if (new Date(expiryDate) < new Date()) {
              return { status: 0, msg: "Token has expired." };
          }
  
          // Step 2: Validate token type matches expected type (e.g., memType)
          if (memType === "user" && tokenType !== "user") {
              return { status: 0, msg: "Invalid token type for user." };
          } else if (memType === "rider" && tokenType !== "rider") {
              return { status: 0, msg: "Invalid token type for rider." };
          }
  
          // Step 3: Fetch user details from the appropriate table
          let user;
        //   console.log("memType:",memType)
          if (memType === "user") {
              
              user = await memberModel.findById(userId);
          } else if (memType === "rider") {
              
              user = await riderModel.findById(userId);
          }
        //   console.log(user)
  
          if (!user) {
              return { status: 0, msg: "User not found." };
          }
  
          // Step 4: Return the user details
          return { status: 1, user };
      } catch (err) {
          console.error("Token validation error:", err.message);
          return { status: 0, msg: "An error occurred while validating the token." };
      }
  }
  
    // Method to send a success response
    sendSuccess(res, data = {}, message = 'Success', statusCode = 200, redirect_url = '') {
        res.status(statusCode).json({
            success: true,
            status:1,
            message: message,
            data: data,
            redirect_url: redirect_url
        });
    }

    // Method to send an error response
    sendError(res, message = 'An error occurred', statusCode = 500) {
        res.status(statusCode).json({
            success: false,
            status:0,
            message: message,
        });
    }
}

module.exports = BaseController;
