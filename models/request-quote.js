// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class RequestQuoteModel extends BaseModel {
    constructor() {
        super('request_quote'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'request_quote';



    // Method to create a new rider with validation
    async createVehicle(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(vehicleId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [vehicleId]);
        console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    // static async getAllRequestQuotes() {
    //     try {
    //         const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
    //         // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
    //         return rows; // Return the fetched rows
    //     } catch (error) {
    //         console.error('Error fetching Request Quotes:', error);
    //         throw error;
    //     }
    // }

    static async getRequestQuotesWithMembers(id) {
        try {
            const query = `
                SELECT 
                    rq.*, 
                    m.id AS user_id, 
                    m.full_name AS member_name, 
                    m.email AS member_email 
                FROM ${this.tableName} rq
                LEFT JOIN members m ON rq.user_id = m.id
                WHERE rq.id = ?
            `;
            const [rows] = await pool.query(query, [id]);
            console.log("getRequestQuotesWithMembers:",rows)
            return rows; // Return the rows with request quotes and member details
        } catch (error) {
            console.error('Error fetching request quotes with members:', error);
            throw error;
        }
    }
    
    static async getRequestQuoteById(id) {
        const [requestQuote] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return requestQuote; // This should be an object, not an array
    }

    static async deleteRequestQuoteById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete Request Quote');
        }
    }

    
}

module.exports = RequestQuoteModel;
