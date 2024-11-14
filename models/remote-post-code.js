// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class RemotePostCodeModel extends BaseModel {
    constructor() {
        super('remote_post_codes'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'remote_post_codes';



    // Method to create a new rider with validation
    async createRemotePostCode(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(remotePostCodeId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [remotePostCodeId]);
        console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllRemotePostCodes() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }
    }
    static async getRemotePostCodeById(id) {
        const [remotePostCode] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return remotePostCode; // This should be an object, not an array
    }

    static async updateRemotePostCode(id, remotePostCodeData) {
        const { title, status } = remotePostCodeData;
        await pool.query(
            `UPDATE ${this.tableName} SET title = ?, status = ? WHERE id = ?`,
            [title, status, id]
        );
    }
    static async deleteRemotePostCodeById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete service');
        }
    }

    
}

module.exports = RemotePostCodeModel;
