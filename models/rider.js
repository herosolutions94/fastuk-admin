const pool = require('../config/db-connection'); // Ensure this is promise-based

class Rider {
    static async getAllRiders() {
        try {
            const [rows] = await pool.query('SELECT * FROM riders'); // Only take the first result
            // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching riders:', error);
            throw error;
        }
    }
    // Add a new method to fetch a rider by id
    static async getRiderById(id) {
        const [rider] = await pool.query('SELECT * FROM riders WHERE id = ?', [id]);
        return rider; // This should be an object, not an array
    }

    // Add a method to update rider info
    static async updateRider(id, riderData) {
        const { full_name, email, phone_number, dob, address, city, vehicle_owner, vehicle_type, vehicle_registration_num, driving_license_num, status, driving_license } = riderData;
        await pool.query(
            'UPDATE riders SET full_name = ?, email = ?, phone_number = ?, dob = ?, address = ?, city = ?, vehicle_owner = ?, vehicle_type = ?, vehicle_registration_num = ?, driving_license_num = ?, status = ?, driving_license = ? WHERE id = ?',
            [full_name, email, phone_number, dob, address, city, vehicle_owner, vehicle_type, vehicle_registration_num, driving_license_num, status, driving_license, id]
        );
    }
    // models/rider.js
static async deleteRiderById(id) {
    try {
        const [result] = await pool.query('DELETE FROM riders WHERE id = ?', [id]);
        return result.affectedRows > 0; // Returns true if a row was deleted
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Failed to delete rider');
    }
}


}

module.exports = Rider;
