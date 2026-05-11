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
    async createVehicleFuel(data) {

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

    async insertMultipleImages(vehicleId, images) {
        if (!images || !images.length) return;

        const values = images.map(img => [vehicleId, img]);

        const query = `
    INSERT INTO vehicle_multiple_images (vehicle_id, image)
    VALUES ?
  `;

        await pool.query(query, [values]);
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
                ORDER BY v.id DESC
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
    static async getAdminVehicles() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE vehicle_type = 'admin'`); // Only take the first result
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
    static async getAdminVehicleById(id) {
        const [vehicle] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ? AND vehicle_type = 'admin'`, [id]);
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
        const { title, price, status, vehicle_image, business_user_price, admin_price, min_mileage, min_price, remote_price, weight, distance, vehicle_category_id, load_capacity, no_of_pallets, max_height, max_length, waiting_charges, handball_charges, max_width, cancellation_charges, rider_min_mileage, rider_min_price, is_fastuk_property, vehicle_rental_price } = vehicleData;
        await pool.query(
            `UPDATE ${this.tableName} SET title = ?, price = ?, status = ?, vehicle_image = ?, business_user_price = ?, admin_price = ?, min_mileage = ?, min_price = ?, remote_price = ?, weight = ?, distance = ?, vehicle_category_id = ?, load_capacity = ?, no_of_pallets = ?, max_height = ?, max_length = ?, waiting_charges = ?, handball_charges = ?, max_width = ?, cancellation_charges = ?, rider_min_mileage = ?, rider_min_price = ?, is_fastuk_property = ?, vehicle_rental_price = ? WHERE id = ?`,
            [title, price, status, vehicle_image, business_user_price, admin_price, min_mileage, min_price, remote_price, weight, distance, vehicle_category_id, load_capacity, no_of_pallets, max_height, max_length, waiting_charges, handball_charges, max_width, cancellation_charges, rider_min_mileage || 0, rider_min_price || 0, is_fastuk_property || 0, vehicle_rental_price || 0, id]
        );
    }
    static async updateAdminVehicle(id, vehicleData) {
        const { title, status, vehicle_registration_number, make_model, vehicle_rental_price, vehicle_image } = vehicleData;
        await pool.query(
            `UPDATE ${this.tableName} SET title = ?, status = ?, vehicle_registration_number = ?, make_model = ?, vehicle_rental_price = ?, vehicle_image = ? WHERE id = ?`,
            [title, status, vehicle_registration_number, make_model, vehicle_rental_price, vehicle_image, id]
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
    static async deleteAdminVehicleById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ? AND vehicle_type = 'admin'`, [id]);
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

    // static async getVehicleByVehicleCategoryId(vehicleCategoryId) {
    //     try {
    //         const query = `
    //   SELECT 
    //     v.*,
    //     GROUP_CONCAT(vmi.image) AS images
    //   FROM vehicles v
    //   LEFT JOIN vehicle_multiple_images vmi
    //     ON vmi.vehicle_id = v.id
    //   WHERE v.vehicle_category_id = ?
    //   GROUP BY v.id
    // `;

    //         const [rows] = await pool.query(query, [vehicleCategoryId]);

    //         // Convert images string → array
    //         return rows.map(vehicle => ({
    //             ...vehicle,
    //             images: vehicle.images ? vehicle.images.split(',') : []
    //         }));

    //     } catch (error) {
    //         console.error("Error fetching vehicle details:", error);
    //         throw error;
    //     }
    // }

    static async getVehicleByVehicleCategoryId(vehicleCategoryId) {
        try {

            const query = `
            SELECT DISTINCT
    v.*,
    GROUP_CONCAT(vmi.image) AS images
FROM vehicles v

LEFT JOIN vehicle_multiple_images vmi
    ON vmi.vehicle_id = v.id

LEFT JOIN rider_vehicle_categories rvc
    ON rvc.category_id = v.id

WHERE v.vehicle_category_id = ?

AND (
    v.is_fastuk_property = 0
    OR rvc.id IS NOT NULL
)

GROUP BY v.id
        `;

            const [rows] = await pool.query(query, [vehicleCategoryId]);
            // console.log("getVehicleByVehicleCategoryId - rows:", rows);

            return rows.map(vehicle => ({
                ...vehicle,
                images: vehicle.images
                    ? vehicle.images.split(',')
                    : []
            }));

        } catch (error) {

            console.error(
                "Error fetching vehicle details:",
                error
            );

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

    static async getAdminVehiclesArr() {
        try {
            const [rows] = await pool.query(`SELECT * FROM vehicles WHERE status = 1 AND vehicle_type = 'admin'`); // Only take the first result
            return rows;
        } catch (error) {
            console.error('Error fetching main vehicle categories:', error);
            throw error;
        }
    }

    static async assignRiderVehicle(rider_id, vehicle_id, vehicle_rent) {

        let fields = [];
        let values = [];

        if (vehicle_id !== undefined && vehicle_id !== null && vehicle_id !== '') {
            fields.push("vehicle_id = ?");
            values.push(vehicle_id);
        }

        if (vehicle_rent !== undefined && vehicle_rent !== null && vehicle_rent !== '') {
            fields.push("vehicle_rent = ?");
            values.push(vehicle_rent);
        }

        if (fields.length === 0) {
            return false; // nothing to update
        }

        values.push(rider_id);

        const sql = `
        UPDATE riders 
        SET ${fields.join(", ")}
        WHERE id = ?
    `;

        return pool.query(sql, values);
    }

    static async removeAssignedVehicle(rider_id) {
        return pool.query(
            `UPDATE riders 
         SET vehicle_id = NULL,
             vehicle_rent = NULL
         WHERE id = ?`,
            [rider_id]
        );
    }

    static async getAssignedVehicleByRiderId(rider_id) {
        const [rows] = await pool.query(
            `SELECT 
        v.*, 
        r.vehicle_id,
        r.vehicle_rent
     FROM riders r
     JOIN vehicles v ON v.id = r.vehicle_id
     WHERE r.id = ?
     AND v.vehicle_type = 'admin'`,
            [rider_id]
        );

        return rows;
    }



}

module.exports = VehicleModel;
