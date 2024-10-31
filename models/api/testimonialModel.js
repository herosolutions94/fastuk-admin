const pool= require('../../config/db-connection');
const BaseModel = require('../baseModel');

class TestimonialModel extends BaseModel {
    constructor() {
        super('testimonials');
    }

    async findFeatured() {
        const [rows] = await pool.query(`SELECT * FROM ?? WHERE status = ?`, [this.tableName, 1]);
        return rows;
    }
}

module.exports = TestimonialModel;
