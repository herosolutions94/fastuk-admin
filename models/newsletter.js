// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class NewsletterModel extends BaseModel {
    constructor() {
        super('subscribers'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'subscribers';



    static async getAllSubscribers() {
        try {
            const [rows] = await pool.query(`SELECT id, email, status, created_at FROM ${this.tableName}`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }
    }

    // Update the status of all subscribers
    static async updateAllSubscribersStatus(status) {
        try {
            const query = `UPDATE ${this.tableName} SET status = ?`;
            await pool.query(query, [status]); // Use parameterized query to prevent SQL injection
        } catch (error) {
            console.error('Error updating subscriber status:', error);
            throw error;
        }
    }

    // Delete a subscriber by ID
    static async deleteSubscriberById(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            await pool.query(query, [id]); // Use parameterized query to prevent SQL injection
        } catch (error) {
            console.error('Error deleting subscriber:', error);
            throw error;
        }
    }


    
}

module.exports = NewsletterModel;
