// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class ServiceModel extends BaseModel {
    constructor() {
        super('services'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'services';



    // Method to create a new rider with validation
    async createService(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(serviceId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [serviceId]);
        console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllServices() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching services:', error);
            throw error;
        }
    }
    static async getServiceById(id) {
        const [service] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return service; // This should be an object, not an array
    }

    static async updateService(id, serviceData) {
        const { title, description, status, service_image } = serviceData;
        await pool.query(
            `UPDATE ${this.tableName} SET title = ?, description = ?, status = ?, service_image = ? WHERE id = ?`,
            [title, description, status, service_image, id]
        );
    }
    static async deleteServiceById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete service');
        }
    }

    
}

module.exports = ServiceModel;
