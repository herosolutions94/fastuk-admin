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
}

module.exports = VehicleModel;
