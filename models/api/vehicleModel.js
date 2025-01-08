const pool= require('../../config/db-connection');
const BaseModel = require('../baseModel');

class VehicleModel extends BaseModel {
    constructor() {
        super('vehicles');
    }

    async findFeatured() {
        const [rows] = await pool.query(`SELECT * FROM ?? WHERE status = ?`, [this.tableName, 1]);
        return rows;
    }
    async getActiveVehicles() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE status=1`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }
    }

}

module.exports = VehicleModel;
