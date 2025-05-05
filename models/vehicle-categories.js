// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class VehicleCategoriesModel extends BaseModel {
    constructor() {
        super('vehicle_categories'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'vehicle_categories';



    // Method to create a new rider with validation
    async createVehicleCategory(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(vehicleCategoryId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [vehicleCategoryId]);
        // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    async findByCode(vehicleCategory) {
        const [rows] = await pool.query(
            `SELECT * FROM promo_codes WHERE promo_code = ? LIMIT 1`,
            [vehicleCategory]
        );
        return rows[0] || null;
    }

    static async getAllVehicleCategories() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`);
            return rows;
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }
    }
    
    static async getVehicleCategoriesById(id) {
        const [vehicleCategory] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return vehicleCategory; // This should be an object, not an array
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
    
    static async updateVehicleCategory(id, vehicleCategoryData) {
        const { vehicle_name, status, vehicle_category_image } = vehicleCategoryData;

    
        await pool.query(
            `UPDATE ${this.tableName} SET vehicle_name = ?, status = ?, vehicle_category_image = ? WHERE id = ?`,
            [vehicle_name, status, vehicle_category_image, id]
        );
    }

    static async getActiveVehicleCategories() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE status=1`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching vehicle category:', error);
            throw error;
        }
    }
    
    static async deleteVehicleCategoryById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete vehicle category');
        }
    }

    
}

module.exports = VehicleCategoriesModel;
