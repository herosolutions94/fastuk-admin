// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class FaqModel extends BaseModel {
    constructor() {
        super('faqs'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'faqs';



    // Method to create a new rider with validation
    async createFaq(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(faqId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [faqId]);
        // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllFaqs() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching faqs:', error);
            throw error;
        }
    }
    static async getFaqById(id) {
        const [faq] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return faq; // This should be an object, not an array
    }

    static async updateFaq(id, faqData) {
        const { ques, ans, status, faq_image } = faqData;
        await pool.query(
            `UPDATE ${this.tableName} SET ques = ?, ans = ?, status = ?, faq_image = ? WHERE id = ?`,
            [ques, ans, status, faq_image, id]
        );
    }
    static async deleteFaqById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete faq');
        }
    }

    
}

module.exports = FaqModel;
