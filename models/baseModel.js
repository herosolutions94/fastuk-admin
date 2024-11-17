const pool = require("../config/db-connection");

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    // Fetch all records
    async findAll() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ??`, [this.tableName]); // Prepared statement for table name
            return rows;
        } catch (error) {
            throw new Error(`Error fetching data from ${this.tableName}: ${error.message}`);
        }
    }

    // Fetch record by ID
    async findById(id) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ?? WHERE id = ?`, [this.tableName, id]); // Table name and ID as placeholders
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error fetching record with id ${id} from ${this.tableName}: ${error.message}`);
        }
    }

    // Insert a new record
    async create(data) {
        try {
            const [result] = await pool.query(`INSERT INTO ?? SET ?`, [this.tableName, data]); // Table name and data as placeholders
            return result.insertId;
        } catch (error) {
            console.error(`Error inserting into ${this.tableName}:`, error.message);  // Log the error for better debugging
            throw new Error(`Error inserting into ${this.tableName}: ${error.message}`);
        }
    }

    // Update an existing record
    async update(id, data) {
        try {
            const [result] = await pool.query(`UPDATE ?? SET ? WHERE id = ?`, [this.tableName, data, id]); // Table name, data, and ID as placeholders
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating record in ${this.tableName}: ${error.message}`);
        }
    }

    // Delete a record by ID
    async delete(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ?? WHERE id = ?`, [this.tableName, id]); // Table name and ID as placeholders
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting record from ${this.tableName}: ${error.message}`);
        }
    }
}

module.exports = BaseModel;
