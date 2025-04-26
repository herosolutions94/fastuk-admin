// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class PromoCodeModel extends BaseModel {
    constructor() {
        super('promo_codes'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'promo_codes';



    // Method to create a new rider with validation
    async createPromoCode(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(promoCodeId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [promoCodeId]);
        // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    async findByPromoCode(promo_code) {
        const query = `SELECT * FROM ${this.tableName} WHERE promo_code = ?`;
        const [rows] = await pool.query(query, [promo_code]);
        // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllPromoCodes() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }
    }
    static async getPromoCodeById(id) {
        const [promoCode] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return promoCode; // This should be an object, not an array
    }
    // static async getRemotePostCodesInArray() {
    //     try {
    //         // Query to fetch post_code and remote_price where status is 1
    //         const [rows] = await pool.query(`SELECT title, remote_price FROM ${this.tableName} WHERE status = 1`);
    
    //         // Map rows to get an array of objects containing title and remote_price
    //         const postCodes = rows.map(row => ({
    //             title: row.title,
    //             remote_price: row.remote_price
    //         }));
    
    //         console.log("postCodes:", postCodes); // Optional: For debugging
            
    //         return postCodes; // Return the array of post codes and their prices
    //     } catch (error) {
    //         console.error('Error fetching remote post codes:', error);
    //         throw error;
    //     }
    // }
    
    static async updatePromoCode(id, promoCodeData) {
        const { promo_code_type, status, percentage_value, expiry_date } = promoCodeData;

        await pool.query(
            `UPDATE ${this.tableName} SET promo_code_type = ?, status = ?, percentage_value = ?, expiry_date = ? WHERE id = ?`,
            [promo_code_type, status, percentage_value, expiry_date || null, id]
        );
    }
    // static async deleteRemotePostCodeById(id) {
    //     try {
    //         const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    //         return result.affectedRows > 0; // Returns true if a row was deleted
    //     } catch (error) {
    //         console.error('Database error:', error);
    //         throw new Error('Failed to delete service');
    //     }
    // }

    
}

module.exports = PromoCodeModel;
