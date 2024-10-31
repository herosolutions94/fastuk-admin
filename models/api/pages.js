const pool = require('../../config/db-connection');
const BaseModel = require('../baseModel');

class PageModel extends BaseModel {
    constructor() {
        super('pages'); // Pass the table name
    }

    async findByKey(key) {
        const [rows] = await pool.query(`SELECT * FROM ?? WHERE \`key\` = ?`, [this.tableName, key]);
        return rows.length ? rows[0] : null;
    }
}

module.exports = PageModel;
