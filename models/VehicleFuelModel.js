// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class VehicleFuelModel extends BaseModel {
  constructor() {
    super('rider_fuel_logs'); // separate table name
  }

  static tableName = 'rider_fuel_logs';

  async createVehicleFuel(data) {
    const query = `
        INSERT INTO ${this.tableName} 
        (rider_id, litres, price_per_litre, status)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        data.rider_id,
        data.litres,
        data.price_per_litre,
        data.status,
    ];

    const [result] = await pool.query(query, values);
    return result.insertId;
}

async getVehicleFuelArr() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE status = 1`); // Only take the first result
            return rows;
        } catch (error) {
            console.error('Error fetching main vehicle categories:', error);
            throw error;
        }
    }

    async getFuelByRiderId(rider_id) {
    const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE rider_id = ? ORDER BY id DESC`,
        [rider_id]
    );
    return rows;
}

async getVehicleFuelById(id) {
        const [vehicleFuel] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return vehicleFuel; // This should be an object, not an array
    }

async updateVehicleFuel(id, vehicleData) {
    const { litres, price_per_litre, status } = vehicleData;

    const query = `
        UPDATE ${this.tableName}
        SET litres = ?, price_per_litre = ?, status = ?
        WHERE id = ?
    `;

    await pool.query(query, [
        litres,
        price_per_litre,
        status,
        id
    ]);
}
}

module.exports = new VehicleFuelModel();