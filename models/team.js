// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class TeamModel extends BaseModel {
    constructor() {
        super('team_members'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'team_members';


    static async findByTitle(title) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE title = ?`;
            const [rows] = await pool.query(query, [title]);
            return rows.length ? rows[0] : null; // Return the first result or null if not found
        } catch (error) {
            console.error('Error finding team member by title:', error);
            throw error;
        }
    }



    // Method to create a new rider with validation
    async createTeamMember(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(teamMemId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [teamMemId]);
        console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    static async getAllTeamMembers() {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching team members:', error);
            throw error;
        }
    }
    static async getTeamMemberById(id) {
        const [teamMember] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return teamMember; // This should be an object, not an array
    }

    static async updateTeamMember(id, teamMemberData) {
        const { title, designation, status, team_mem_image } = teamMemberData;
        await pool.query(
            `UPDATE ${this.tableName} SET title = ?, designation = ?, status = ?, team_mem_image = ? WHERE id = ?`,
            [title, designation, status, team_mem_image, id]
        );
    }
    static async deleteTeamMemberById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete team member');
        }
    }

    
}

module.exports = TeamModel;
