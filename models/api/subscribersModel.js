// models/RiderModel.js
const pool = require('../../config/db-connection');
const BaseModel = require('../baseModel');

class SubscribersModel extends BaseModel {
    constructor() {
        super('subscribers'); // Pass the table name to the BaseModel constructor
    }


    // Method to create a new rider with validation
    async createSubscriber(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findByEmail(id) {
        const query = `SELECT * FROM subscribers WHERE id = ?`;
        const [rows] = await pool.query(query, [id]);
        // console.log(rows)
        return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllSubscribers() {
        try {
            const [rows] = await pool.query('SELECT * FROM subscribers'); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            throw error;
        }
    }
    static async deleteTestimonialById(id) {
        try {
            const [result] = await pool.query('DELETE FROM subscribers WHERE id = ?', [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete rider');
        }
    }

    
}

module.exports = SubscribersModel;
