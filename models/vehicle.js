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

    // static async getAllVehicles() {
    //     try {
    //         const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
    //         // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
    //         return rows; // Return the fetched rows
    //     } catch (error) {
    //         console.error('Error fetching vehicle:', error);
    //         throw error;
    //     }
    // }

    async insertMultipleImage(data) {
    const { vehicle_id, image } = data;
    const query = `INSERT INTO vehicle_multiple_images (vehicle_id, image) VALUES (?, ?)`;

    return new Promise((resolve, reject) => {
        pool.query(query, [vehicle_id, image], (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId); // MySQL returns insertId
        });
    });
}




    static async getAllVehicles() {
        try {
            const query = `
            SELECT 
                v.*, 
                vc.vehicle_name AS category_name
            FROM 
                vehicles v
            LEFT JOIN 
                vehicle_categories vc
            ON 
                v.vehicle_category_id = vc.id
        `;

            const [rows] = await pool.query(query);
            return rows;
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

    static async getSelectedVehicleById(vehicleId) {
        const [rows] = await pool.query(
            `SELECT * FROM vehicles WHERE id = ? LIMIT 1`,
            [vehicleId]
        );
        return rows.length ? rows[0] : null;
    }

    static async getVehicleById(id) {
        const [vehicle] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return vehicle; // This should be an object, not an array
    }

    static async getVehicleImageById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM vehicle_multiple_images WHERE id = ?`,
    [id]
  );

//   console.log("vehicleImage:", id, rows);

  return rows[0]; // ✅ return OBJECT, not array
}


    // Vehicle model
    static async getVehicleMultipleImages(vehicleId) {
        const [rows] = await pool.query(
            `SELECT * FROM vehicle_multiple_images WHERE vehicle_id = ?`,
            [vehicleId]
        );
        return rows;
    }

    static async deleteVehicleMultipleImages(vehicleId) {
        await pool.query(
            `DELETE FROM vehicle_multiple_images WHERE vehicle_id = ?`,
            [vehicleId]
        );
    }


    static async updateVehicle(id, vehicleData) {
        const { title, price, status, vehicle_image, business_user_price, admin_price, min_mileage, min_price, remote_price, weight, distance, vehicle_category_id, load_capacity, no_of_pallets, max_height, max_length, waiting_charges, handball_charges, max_width, cancellation_charges } = vehicleData;
        await pool.query(
            `UPDATE ${this.tableName} SET title = ?, price = ?, status = ?, vehicle_image = ?, business_user_price = ?, admin_price = ?, min_mileage = ?, min_price = ?, remote_price = ?, weight = ?, distance = ?, vehicle_category_id = ?, load_capacity = ?, no_of_pallets = ?, max_height = ?, max_length = ?, waiting_charges = ?, handball_charges = ?, max_width = ?, cancellation_charges = ? WHERE id = ?`,
            [title, price, status, vehicle_image, business_user_price, admin_price, min_mileage, min_price, remote_price, weight, distance, vehicle_category_id, load_capacity, no_of_pallets, max_height, max_length, waiting_charges, handball_charges, max_width, cancellation_charges, id]
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

    static async deleteVehicleImageById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM vehicle_multiple_images WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete service');
        }
    }

    // static async getVehicleByVehicleCategoryId(vehicleCategoryId) {
    //     try {
    //         const [rows] = await pool.query("SELECT * FROM vehicles WHERE vehicle_category_id = ?", [vehicleCategoryId]);
    //         return rows;
    //     } catch (error) {
    //         console.error("Error fetching vehicle details:", error);
    //         throw error;
    //     }
    // }

    static async getVehicleByVehicleCategoryId(vehicleCategoryId) {
  try {
    const query = `
      SELECT 
        v.*,
        GROUP_CONCAT(vmi.image) AS images
      FROM vehicles v
      LEFT JOIN vehicle_multiple_images vmi
        ON vmi.vehicle_id = v.id
      WHERE v.vehicle_category_id = ?
      GROUP BY v.id
    `;

    const [rows] = await pool.query(query, [vehicleCategoryId]);

    // Convert images string → array
    return rows.map(vehicle => ({
      ...vehicle,
      images: vehicle.images ? vehicle.images.split(',') : []
    }));

  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    throw error;
  }
}



    static async getCategoryAndMainCategoryById(vehicleId) {
        const categoryQuery =
            `SELECT 
      v.title AS main_category_name,
      vc.vehicle_name AS category_name
    FROM vehicles v
    INNER JOIN vehicle_categories vc ON v.vehicle_category_id = vc.id
    WHERE v.id = ?
    LIMIT 1
  `;
        const [rows] = await pool.query(categoryQuery, [vehicleId]);
        // console.log("vehicleId:", vehicleId);

        //   console.log("rows:", rows);
        return rows.length ? rows[0] : null;
    }



    static async getVehicleCategoryById(id) {
        const query = `SELECT * FROM vehicle_categories WHERE id = ? LIMIT 1`;
        const [rows] = await pool.query(query, [id]);
        return rows.length ? rows[0] : null;
    }



}

module.exports = VehicleModel;
