// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class TestimonialModel extends BaseModel {
    constructor() {
        super('testimonials'); // Pass the table name to the BaseModel constructor
    }


    // Method to create a new rider with validation
    async createTestimonial(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(testimonialId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [testimonialId]);
        console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllTestimonials() {
        try {
            const [rows] = await pool.query('SELECT * FROM testimonials'); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            throw error;
        }
    }
    static async getTestimonialById(id) {
        const [testimonial] = await pool.query('SELECT * FROM testimonials WHERE id = ?', [id]);
        return testimonial; // This should be an object, not an array
    }

    static async updateTestimonial(id, testimonialData) {
        const { title, designation, description, status, testi_image } = testimonialData;
        await pool.query(
            'UPDATE testimonials SET title = ?, designation = ?, description = ?, status = ?, testi_image = ? WHERE id = ?',
            [title, designation, description, status, testi_image, id]
        );
    }
    static async deleteTestimonialById(id) {
        try {
            const [result] = await pool.query('DELETE FROM testimonials WHERE id = ?', [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete rider');
        }
    }

    
}

module.exports = TestimonialModel;
