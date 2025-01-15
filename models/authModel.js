// models/AdminModel.js
const BaseModel = require('./baseModel');

const pool = require('../config/db-connection'); // Make sure this points to your database configuration
const bcrypt = require('bcrypt');

class AdminModel extends BaseModel {
    constructor() {
        // this.tableName = 'tbl_admin'; // The table name where admin data is stored
        super('tbl_admin')
    }

    // Find admin by email
    async findByUsername(user_name) {
        const query = `SELECT * FROM ?? WHERE user_name = ?`;
        const [rows] = await pool.query(query, [this.tableName, user_name]);
        return rows.length ? rows[0] : null; // Return admin if found, otherwise null
    }

    async findById(userId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [userId]);
        // console.log(rows)
        return rows.length ? rows[0] : null; // Return the first result or null
    }

    // Update site settings
    // Update site settings
    async updateSettings(data) {
        const query = `
        UPDATE ${this.tableName} 
        SET 
            site_domain = ?,
            site_name = ?, site_email = ?, site_address = ?, receiving_site_email = ?, 
            site_noreply_email = ?, site_phone = ?, footer_copyright = ?, site_facebook = ?, site_twitter = ?, 
            site_instagram = ?, site_youtube = ?, site_spotify = ?, site_etsy = ?, logo_image = ?, 
            favicon_image = ?, thumb_image = ?,
            site_sandbox = ?, site_processing_fee=?
        WHERE id = 1`;

        const values = [
            data.site_domain || '', data.site_name || '', data.site_email || '', data.site_address || '', data.receiving_site_email || '',
            data.site_noreply_email || '', data.site_phone || '', data.footer_copyright || '', data.site_facebook || '', data.site_twitter || '',
            data.site_instagram || '', data.site_youtube || '', data.site_spotify || '', data.site_etsy || '', data.logo_image || null,
            data.favicon_image || null, data.thumb_image || null,
            data.site_sandbox ? parseInt(data.site_sandbox) : 0, data?.site_processing_fee ? data?.site_processing_fee : 0
        ];

        try {
            // console.log('Query:', query);
            // console.log('Values:', values);
            await pool.query(query, values);
            return true;
        } catch (error) {
            console.error('Error updating site settings:', error);
            throw error;
        }
    }


    async getSettings() {
        // Use a parameterized query with the appropriate value for the placeholder
        const query = 'SELECT * FROM tbl_admin WHERE id = ?';
        const values = [1]; // Assuming you're fetching settings for the admin with id = 1

        try {
            const [rows] = await pool.query(query, values); // Destructure to get the rows from the result
            // console.log('Fetched settings:', rows); // Log the fetched settings
            return rows[0]; // Return the first row (the settings)
        } catch (error) {
            console.error('Error fetching site settings:', error);
            throw error;
        }
    }



    // Update the AdminModel class
    async updatePassword(adminId, newPassword) {
        const query = `UPDATE ${this.tableName} SET password = ? WHERE id = ?`;
        const values = [newPassword, adminId];

        try {
            await pool.query(query, values);
            return true;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }


}

module.exports = new AdminModel();
