const pool  = require('../config/db-connection');
const BaseModel = require('./baseModel');

class PagesModel extends BaseModel {
    constructor() {
        super('pages'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'pages';

    async findByKey(key) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ?? WHERE \`key\` = ?`, [this.tableName, key]);
            // console.log(rows)
            return rows.length ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error fetching data with key ${key}: ${error.message}`);
        }
    }

    async createPage(key) {
        try {
            const insertText = `INSERT INTO ?? (\`key\`, content) VALUES (?, ?)`;
            const [result] = await pool.query(insertText, [this.tableName, key, null]);
            // console.log(result)
            return result.insertId;
        } catch (error) {
            throw new Error(`Error inserting into ${this.tableName}: ${error.message}`);
        }
    }
    
    async updatePageContent(key, content) {
        await pool.query("UPDATE pages SET content = ? WHERE `key` = ?",
        [content, key]
        )
    }

    async getSecTextValues(key) {
        try {
            const query = `SELECT "text" FROM multi_text WHERE "key" = ?`;
            const [rows] = await pool.query(query, [key]);
            return rows.map(row => row.text);
        } catch (error) {
            throw new Error(`Error fetching sec_text values with key ${key}: ${error.message}`);
        }
    }

    // Clear old sec_text values and insert new ones into multi_text table
    async deleteSecTextValues(key) {
        try {
            const query = `DELETE FROM multi_text WHERE "key" = ?`;
            const [rows] = await pool.query(query, [key]);
            return rows.affectedRows > 0; // Returns true if a row was deleted        
            } catch (error) {
            throw new Error(`Error deleting sec_text values with key ${key}: ${error.message}`);
        }
    }
    async insertSecTextValues(key, newSecTextValues) {
        const insertQuery = `INSERT INTO multi_text (\`key\`, \`text\`) VALUES (?, ?)`;
        
        // Ensure to loop through and insert each value
        for (const text of newSecTextValues) {
            await pool.query(insertQuery, [key, text]);
        }
    }

    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM members WHERE email = $1', [email]);
        return result.rows[0]; // Return user if found
    }

    static async create(name, email) {
        const result = await pool.query(
            'INSERT INTO members (name, email, type) VALUES ($1, $2, $3) RETURNING id',
            [name, email, 'member']
        );
        return result.rows[0].id; // Return newly created user ID
    }
    
    

}

module.exports = PagesModel;
