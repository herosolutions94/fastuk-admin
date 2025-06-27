// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class VehicleCategoriesModel extends BaseModel {
    constructor() {
        super('vehicle_categories'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'vehicle_categories';



    // Method to create a new rider with validation
    

    static async getMainCategories () {
try {
            const [rows] = await pool.query(`SELECT id, vehicle_name FROM ${this.tableName} WHERE status = 1`);
            return rows;
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            throw error;
        }  
    }

  static async getSubCategoriesByParentId(parentId) {
  try {
    const [rows] = await pool.query(`
      SELECT id, vehicle_name
      FROM vehicle_categories
      WHERE parent_id = ? AND status = 1
    `, [parentId]);

    return rows;
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
}


  static async saveRiderCategory(riderId, categoryId) {
  return pool.query(
    `INSERT INTO rider_vehicle_categories (rider_id, category_id) VALUES (?, ?)`,
    [riderId, categoryId]
  );
}

static async getCategoriesByRiderId(riderId) {
  try {
    const [rows] = await pool.query(`
      SELECT vc.id, vc.vehicle_name
      FROM rider_vehicle_categories rvc
      INNER JOIN vehicle_categories vc ON rvc.category_id = vc.id
      WHERE rvc.rider_id = ?
    `, [riderId]);

    console.log("rows:",rows)

    return rows;
  } catch (error) {
    console.error("Error fetching rider's categories:", error);
    throw error;
  }
}

static async saveRiderCategory(riderId, categoryId) {
  return pool.query(`
    INSERT INTO rider_vehicle_categories (rider_id, category_id)
    VALUES (?, ?)`, [riderId, categoryId]);
}

static async deleteCategoriesByRiderId(riderId) {
  return pool.query(`DELETE FROM rider_vehicle_categories WHERE rider_id = ?`, [riderId]);
}

static async getCategoryById(categoryId) {
  const [rows] = await pool.query(`
    SELECT * FROM vehicle_categories WHERE id = ? LIMIT 1
  `, [categoryId]);
  return rows[0] || null;
}

static async updateRiderCategory(riderId, oldCategoryId, newCategoryId) {
  return pool.query(`
    UPDATE rider_vehicle_categories
    SET category_id = ?
    WHERE rider_id = ? AND category_id = ?
  `, [newCategoryId, riderId, oldCategoryId]);
}

static async deleteRiderCategory(riderId, categoryId) {
  return pool.query(`
    DELETE FROM rider_vehicle_categories
    WHERE rider_id = ? AND category_id = ?
  `, [riderId, categoryId]);
}



   
    
}

module.exports = VehicleCategoriesModel;
