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

    static async getSubscriberById(id) {
        const [subscriber] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        if (subscriber.length > 0) {
            // Update the status to 1 (read) if it's currently 0 (unread)
            // if (subscriber[0].status === 0) {
            //     await pool.query('UPDATE messages SET status = 1 WHERE id = ?', [id]);
            // }
            return subscriber;    
        } else {
            return null; // No message found
        }
    } catch (error) {
        console.error('Error fetching subscriber:', error);
        throw error;
    }


    // Delete a subscriber by ID
    static async deleteSubscriberById(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const [result] = await pool.query(query, [id]); // Use parameterized query to prevent SQL injection
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting subscriber:', error);
            throw error;
        }
    }


    
}

module.exports = NewsletterModel;
