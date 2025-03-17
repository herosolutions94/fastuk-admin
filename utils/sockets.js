const moment = require('moment');
const pool = require('../config/db-connection');
const helpers = require('./helpers');


// Function to get user_id from token and memType
async function getUserIdFromToken(token, memType) {
  try {
      // Step 1: Decrypt the token to extract the user info
      let decryptedToken;
      try {
          decryptedToken = helpers.decryptToken(token); // Assuming decryptToken is implemented in helpers
      } catch (err) {
          // Return an appropriate response in case of token decryption failure
          console.error('Decryption failed:', err.message);
          return null;
      }

      // Step 2: Split the decrypted token (assuming token is in a specific format like 'xxx-yyy-userId')
      const parts = decryptedToken.split("-");
      if (parts.length < 3) {
        //   console.log('Invalid token format');
          return null; // Token format is invalid
      }

      const userId = parts[2]; // Extract the userId from the token

      let query = '';
      let user = null; // Initialize user variable

      // Step 3: Validate the user or fetch additional data based on memType (optional)
      if (memType === "user") {
          query = `SELECT * FROM members WHERE id = ? AND mem_type = ?`;
          const [userRows] = await pool.query(query, [userId, memType]); 
          user = userRows[0]; // Store the result in user variable
      } else if (memType === "rider") {
          query = `SELECT * FROM riders WHERE id = ?`;
          const [riderRows] = await pool.query(query, [userId, memType]);
          user = riderRows[0]; // Store the result in user variable
      }

      if (user) {
          // If the user exists in the database, return the user_id
          return userId;
      } else {
        //   console.log('User not found in the database or invalid memType');
          return null; // or throw an error if you prefer
      }
  } catch (error) {
      console.error('Error getting user_id from token:', error.message);
      return null; // Handle error gracefully
  }
}

  

module.exports = { getUserIdFromToken };
