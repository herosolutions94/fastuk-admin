// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');
const bcrypt = require('bcrypt')

class SubAdminModel extends BaseModel {
    constructor() {
        super('tbl_admin'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'tbl_admin';



    // Method to create a new rider with validation
    async createSubAdmin(data) {

        return this.create(data);  // Call the BaseModel's create method
    }

    async findById(subAdminId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [subAdminId]);
        console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllSubAdmins() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} where type='sub_admin'`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching sub admins:', error);
            throw error;
        }
    }

    static async getSubAdminById(id, type) {
        const [subAdmin] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ? AND type = ?`, [id, type]);
        console.log("subAdmin:", subAdmin);
        return subAdmin; // This will return only sub_admin if found
    }
    

    static async updateSubAdmin(id, subAdminData) {
        const { name, user_name, status, password } = subAdminData;
        let hashedpassword = null;
    
        if (password) {
            hashedpassword = await bcrypt.hash(password, 10);
        }
    
        let query = `UPDATE ${this.tableName} SET name = ?, user_name = ?, status = ?`;
        let values = [name, user_name, status];
    
        if (hashedpassword) {
            query += `, password = ?`;
            values.push(hashedpassword);
        }
    
        query += ` WHERE id = ? AND type='sub_admin'`;
        console.log(query)
        values.push(id);
    
        await pool.query(query, values);
    }

    static async deleteSubAdminById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete service');
        }
    }

    static async deletePermissions(admin_id) {
        return pool.query(`DELETE FROM site_permissions_admin WHERE admin_id = ?`, [admin_id]);
        
    }

    static async assignPermissions(admin_id, permissionArray) {
        const values = permissionArray.map((perm) => `(${admin_id}, ${perm})`).join(',');
    
        if (values.length > 0) {
            return pool.query(`INSERT INTO site_permissions_admin (admin_id, permission_id) VALUES ${values}`);
        }
    }
    

    static async getPermissions(sub_admin_id) {
        const [rows] = await pool.query(
            'SELECT permission_id FROM site_permissions_admin WHERE admin_id = ?',
            [sub_admin_id]
        );
    
        console.log("🔍 Raw query result:", rows); // Should be an array of objects
    
        if (!rows.length) {
            console.log("❌ No permissions found for this sub-admin.");
            return [];
        }
    
        const permissionIds = rows.map(row => row.permission_id);
        console.log("✅ Extracted permission IDs:", permissionIds);
    
        return permissionIds;
    }
    
    
    
    static async getAllPermissions() {
        const [result] = await pool.query('SELECT * FROM site_permissions'); // Assuming your table name is `permissions`
        console.log("Raw permissions result:", result);

        return result;
    }
    

}

module.exports = SubAdminModel;