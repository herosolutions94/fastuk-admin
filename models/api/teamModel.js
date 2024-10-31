const pool= require('../../config/db-connection');
const BaseModel = require('../baseModel');

class TeamModel extends BaseModel {
    constructor() {
        super('team_members');
    }

    async findFeatured() {
        const [rows] = await pool.query(`SELECT * FROM ?? WHERE status = ?`, [this.tableName, 1]);
        return rows;
    }
}

module.exports = TeamModel;
