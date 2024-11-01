const pool= require('../../config/db-connection');
const BaseModel = require('../baseModel');

class FaqModel extends BaseModel {
    constructor() {
        super('faqs');
    }

    async findFeatured() {
        const [rows] = await pool.query(`SELECT * FROM ?? WHERE status = ?`, [this.tableName, 1]);
        return rows;
    }
}

module.exports = FaqModel;
