// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class MemberModel extends BaseModel {
    constructor() {
        super('members'); // Pass the table name to the BaseModel constructor
    }

    // Method to check if an email exists (find by email)
    async findByEmail(email) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE email = ?`, [email]);
            return rows.length ? rows[0] : null; // Return the first result or null
        } catch (error) {
            throw new Error(`Error fetching member by email from ${this.tableName}: ${error.message}`);
        }
    }

    async findByOtp(otp) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE otp = ?`, [otp]);
            return rows.length ? rows[0] : null; // Return the first result or null
        } catch (error) {
            throw new Error(`Error fetching member by otp from ${this.tableName}: ${error.message}`);
        }
    }

    // Method to check if an email already exists
    async emailExists(email) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE email = ?`, [email]);
            return rows.length > 0; // Returns true if email exists, false otherwise
        } catch (error) {
            throw new Error(`Error checking if email exists in ${this.tableName}: ${error.message}`);
        }
    }

    // Method to create a new rider with validation
    async createMember(data) {
        // console.log('Attempting to insert user:', data); // Log the data to insert

        if (await this.findByEmail(data.email)) {
            throw new Error(`Email ${data.email} is already in use.`);
        }

        try {
            const userId = await this.create(data); // Call the BaseModel's create method
            // console.log('Inserted user ID:', userId); // Log the inserted ID
            return userId;
        } catch (error) {
            console.error('Error creating member:', error.message); // Log the error
            throw error;
        }
    }

    async findById(memberId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [memberId]);
        // console.log(rows)
        return rows.length ? rows[0] : null; // Return the first result or null
    }

    // Function to update rider's verified status and set OTP to null
    async updateMemberVerification(memberId) {
        const query = `UPDATE members SET mem_verified = 1, otp = NULL WHERE id = ?`;
        await pool.query(query, [memberId]);
    }
    async updateMemberData(memberId, data) {
        // Extract keys and values from the data object
        const keys = Object.keys(data); // ['otp', 'expire_time']
        const values = Object.values(data); // [newOtp, newExpireTime]

        // Construct the SET clause dynamically
        const setClause = keys.map(key => `${key} = ?`).join(', '); // e.g., "otp = ?, expire_time = ?"

        // Build the query dynamically
        const query = `UPDATE members SET ${setClause} WHERE id = ?`;

        // Execute the query, adding the memberId to the values array
        await pool.query(query, [...values, memberId]);
    }

    async updateOtp(memberId, otp) {
        const query = 'UPDATE members SET otp = ? WHERE id = ?';
        const values = [otp, memberId];
        await pool.query(query, values); // Updates the OTP for the member
    }
    async updatePassword(memberId, hashedPassword) {
        const query = `UPDATE ${this.tableName} SET password = ? WHERE id = ?`;
        await pool.query(query, [hashedPassword, memberId]);
    }


async updateMemberImage (userId, imageUrl) {
  const query = `UPDATE ${this.tableName} SET mem_image = ? WHERE id = ? RETURNING mem_image`;
  const values = [imageUrl, userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

}
module.exports = MemberModel;
