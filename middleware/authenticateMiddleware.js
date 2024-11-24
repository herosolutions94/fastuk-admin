const helpers = require("../utils/helpers");

// Middleware to verify and fetch user based on memtype and token
const authenticateUser = async (req, res, next) => {
    try {
      const { memtype, token } = req.body;
  
      if (!token || !memtype) {
        return res.status(200).json({ error: 'Token and memtype are required' });
      }
  
      /// Decrypt the token
      let decryptedToken;
      try {
        decryptedToken = helpers.decryptToken(token);
      } catch (err) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid or corrupted token." });
      }
      const parts = decryptedToken.split("-");
      if (parts.length < 3) {
        return res
          .status(200)
          .json({ status: 0, msg: "Invalid token format." });
      }

      const userId = parts[2]; // Extract userId
  
      let user;
      if (memtype === 'user') {
        const result = await pool.query('SELECT * FROM members WHERE id = ? AND type = ?', [userId, 'member']);
        user = result.rows[0];
      } else if (memtype === 'rider') {
        const result = await pool.query('SELECT * FROM riders WHERE id = ?', [userId]);
        user = result.rows[0];
      } else {
        return res.status(200).json({ error: 'Invalid memtype' });
      }
  
      if (!user) {
        return res.status(200).json({ error: 'User not found' });
      }
  
      // Attach user data to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Error in authentication middleware:', error);
      res.status(200).json({ error: 'Invalid or expired token' });
    }
  };
module.exports = authenticateUser;  