const db = require('../config/db-connection'); // Adjust this according to your database configuration

class Token {
    async storeToken(userId, token, type, expiryDate, fingerprint, userType) {
        const query = `
            INSERT INTO tokens (user_id, user_type, token, type, created_at, expiry_date, fingerprint)
            VALUES (?, ?, ?, ?, NOW(), ?, ?);
        `;
        const values = [userId, userType, token, type, expiryDate, fingerprint];
        // console.log('values:',values)
    
        // Extracting insertId correctly from the result array
        const [result] = await db.query(query, values); // Destructuring to access first element directly
        // console.log('Token stored with ID:', result.insertId); // Should now correctly log the insertId
        return result.insertId;
    }
    
    

    async findByToken(token) {
        const query = `SELECT * FROM tokens WHERE token = ?`;
        const [result] = await db.query(query, [token]);
        // console.log("Result from findByToken query:", result); // Check output here

        return result[0]|| null;
    }
    
    async deleteToken(token) {
        const query = `DELETE FROM tokens WHERE token = ?`;
        await db.query(query, [token]);
    }

    
}

module.exports = Token;
