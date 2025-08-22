// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class VehicleModel extends BaseModel {
    constructor() {
        super('vehicles'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'vehicles';



    // Method to create a new rider with validation
    async createVehicle(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(vehicleId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [vehicleId]);
        // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllVehicles() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }
    }
    static async getActiveVehicles() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE status=1`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }
    }
    static async getVehicleById(id) {
        const [vehicle] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return vehicle; // This should be an object, not an array
    }

    static async updateVehicle(id, vehicleData) {
        const { title, price, status, vehicle_image, business_user_price, admin_price, remote_price, weight, distance, vehicle_category_id,load_capacity,no_of_pallets, max_height} = vehicleData;
        await pool.query(
            `UPDATE ${this.tableName} SET title = ?, price = ?, status = ?, vehicle_image = ?, business_user_price = ?, admin_price = ?, remote_price = ?, weight = ?, distance = ?, vehicle_category_id = ?, load_capacity = ?, no_of_pallets = ?, max_height = ? WHERE id = ?`,
            [title, price, status, vehicle_image, business_user_price, admin_price, remote_price, weight, distance, vehicle_category_id, load_capacity, no_of_pallets, max_height, id]
        );
    }
    static async deleteVehicleById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete service');
        }
    }

    static async getVehicleByVehicleCategoryId(vehicleCategoryId) {
        try {
            const [rows] = await pool.query("SELECT * FROM vehicles WHERE vehicle_category_id = ?", [vehicleCategoryId]);
            return rows;
        } catch (error) {
          console.error("Error fetching vehicle details:", error);
          throw error;
        }
      }

      
  static async getCategoryAndMainCategoryById(vehicleId) {
  const categoryQuery = `
    SELECT vc.vehicle_name AS category_name, v.title AS main_category_name
    FROM vehicles v
    LEFT JOIN vehicle_categories vc ON vc.parent_id = v.id
    WHERE v.id = ? 
    LIMIT 1
  `;
  const [rows] = await pool.query(categoryQuery, [vehicleId]);
  console.log("rows:", rows);
  return rows.length ? rows[0] : null;
}


  static async getVehicleCategoryById(id) {
    const query = `SELECT * FROM vehicle_categories WHERE id = ? LIMIT 1`;
    const [rows] = await pool.query(query, [id]);
    return rows.length ? rows[0] : null;
  }


    
}

module.exports = VehicleModel;
