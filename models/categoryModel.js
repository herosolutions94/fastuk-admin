// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class VehicleCategoriesModel extends BaseModel {
    constructor() {
        super('vehicle_categories'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'vehicle_categories';



    // Method to create a new rider with validation

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
  static async getVehiclesByParentId(parentId) {
  try {
    const [rows] = await pool.query(`
      SELECT id,title as vehicle_name
      FROM vehicles
      WHERE vehicle_category_id = ?
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

static async getMainCategories() {
  try {
    const [rows] = await pool.query(`SELECT id, title FROM vehicles WHERE status = 1`);
    return rows;
  } catch (error) {
    console.error('Error fetching main vehicle categories:', error);
    throw error;
  }
}
static async getMainCategoriesArr() {
  try {
    const [rows] = await pool.query(`SELECT id, vehicle_name as title FROM vehicle_categories WHERE status = 1`);
    return rows;
  } catch (error) {
    console.error('Error fetching main vehicle categories:', error);
    throw error;
  }
}


static async getCategoriesByRiderId(riderId) {
  try {
    const [rows] = await pool.query(`
      SELECT rvc.id AS rider_category_id, vc.vehicle_name AS sub_category_name, v.title AS main_category_name FROM rider_vehicle_categories rvc LEFT JOIN vehicles v ON rvc.category_id = v.id INNER JOIN vehicle_categories vc ON v.vehicle_category_id = vc.id WHERE rvc.rider_id= ?
    `, [riderId]);

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

static async deleteRiderCategoryById(id) {
  const [result] = await pool.query(
    `DELETE FROM rider_vehicle_categories WHERE id = ?`,
    [id]
  );
  return result;
}

static async getRiderCategoryById(riderCategoryId) {
  const [rows] = await pool.query(`
    SELECT * FROM rider_vehicle_categories WHERE id = ? LIMIT 1
  `, [riderCategoryId]);
  return rows[0] || null;
}



static async getCategoryById(categoryId) {
  const [rows] = await pool.query(`
    SELECT * FROM vehicle_categories WHERE id = ? LIMIT 1
  `, [categoryId]);
  return rows[0] || null;
}
static async getVehicleById(categoryId) {
  const [rows] = await pool.query(`
    SELECT * FROM vehicles WHERE id = ? LIMIT 1
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


static async updateRiderCategoryById(riderCategoryId, newCategoryId) {
  const [result] = await pool.query(`
    UPDATE rider_vehicle_categories
    SET category_id = ?
    WHERE id = ?
  `, [newCategoryId, riderCategoryId]);

  return result;
}



static async deleteRiderCategory(riderId, categoryId) {
  return pool.query(`
    DELETE FROM rider_vehicle_categories
    WHERE rider_id = ? AND category_id = ?
  `, [riderId, categoryId]);
}



   
    
}

module.exports = VehicleCategoriesModel;
