// models/RiderModel.js
const pool = require('../../config/db-connection');
const BaseModel = require('../baseModel');

class AddressModel extends BaseModel {
    constructor() {
        super('member_addresses'); // Pass the table name to the BaseModel constructor
    }

    // Fetch addresses by user ID
    async getAddressesByUserId(userId) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE mem_id = ?`;
            const values = [userId];
            const [rows] = await pool.query(query, values); // Use pool.query for PostgreSQL
            return rows; // Returns an array of address rows
        } catch (error) {
            throw new Error(`Error fetching addresses from ${this.tableName}: ${error.message}`);
        }
    }
    // Insert a new address
    async insertAddress(data) {
        const query = `
            INSERT INTO ${this.tableName} 
            (mem_id, first_name, last_name, phone_number, address, post_code, city, \`default\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        console.log(data);
        const values = [
            data.mem_id,
            data.first_name,
            data.last_name,
            data.phone_number,
            data.address,
            data.post_code,
            data.city,
            data.default
        ];
        const [rows] = await pool.query(query, values);
        return rows; // Return the inserted row
    }
     async getAddressById(id,mem_id) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ? and mem_id = ?`, [id,mem_id]);
            return rows; // Ensure this returns an array
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to fetch address');
        }
    }
    async updateData(address_id, data) {
        console.log(data)
        try {
            // Validate that data is not empty
            if (Object.keys(data).length === 0) {
                throw new Error('No data provided to update');
            }
    
            // Extract keys and values from the data object
            const keys = Object.keys(data); // ['first_name', 'last_name', ...]
            const values = Object.values(data); // [newFirstName, newLastName, ...]
    
            // Construct the SET clause dynamically
            const setClause = keys.map(key => `${key} = ?`).join(', '); // e.g., "first_name = ?, last_name = ?"
    
            // Build the query dynamically
            const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    console.log(query)
            // Execute the query, adding the address_id to the values array
            await pool.query(query, [...values, address_id]);
    
            console.log('Address updated successfully'); // Optional: Logging for debugging
    
        } catch (error) {
            console.error("Error in updateData:", error.message);
            throw error; // Re-throw the error so it can be handled by the calling method
        }
    }
    
    async deleteAddress(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete rider');
        }
    }
    async resetDefaultStatusForUser(userId) {
        const query = `UPDATE ${this.tableName} SET \`default\` = 0 WHERE mem_id = ?`;
        const [result] = await pool.query(query, [userId]);
        console.log(`resetDefaultStatusForUser: Updated rows: ${result.affectedRows}`);
    }
    
    async setAsDefaultAddress(address_id) {
        const query = `UPDATE ${this.tableName} SET \`default\` = 1 WHERE id = ?`;
        const [result] = await pool.query(query, [address_id]);
        console.log(`setAsDefaultAddress: Updated rows: ${result.affectedRows}`);
        return result.affectedRows > 0; // Returns true if at least one row was updated
    }
    
        

}

module.exports = AddressModel;
