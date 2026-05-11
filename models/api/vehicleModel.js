const pool = require('../../config/db-connection');
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
        const [rows] = await pool.query(`
            SELECT * 
            FROM ${this.tableName} 
            WHERE status = 1 
            AND is_fastuk_property != 1
        `);

        return rows;
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        throw error;
    }
}

    async getVehicleCategoriesByWeight(totalWeight) {
  const query = `
    SELECT DISTINCT
      vc.id,
      vc.vehicle_name,
      vc.vehicle_category_image
    FROM vehicle_categories vc
    INNER JOIN vehicles v
      ON v.vehicle_category_id = vc.id
    WHERE v.load_capacity >= ?
      AND v.status = 1
      AND vc.status = 1
  `;

  const [rows] = await pool.query(query, [totalWeight]);
  return rows;
}


}

module.exports = VehicleModel;
