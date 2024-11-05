const pool = require('../config/db-connection'); // Ensure this is promise-based

class Member {
    static async getAllMembers() {
        try {
            const [rows] = await pool.query('SELECT * FROM members'); // Only take the first result
            // console.log('Members fetched successfully:', rows); // Log the data (only the rows)
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching members:', error);
            throw error;
        }
    }
    // Add a new method to fetch a rider by id
    static async getMemberById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);
            return rows; // Ensure this returns an array
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to fetch member');
        }
    }

    // Add a method to update member info
    static async updateMember(id, memberData) {
        const { full_name, email, mem_phone, mem_address1, mem_city, mem_state, mem_status, created_at, mem_image } = memberData;
        try {

            const sql = `
            UPDATE members 
            SET 
                full_name = ?, 
                email = ?, 
                mem_phone = ?, 
                mem_address1 = ?, 
                mem_city = ?, 
                mem_state = ?, 
                mem_status = ?, 
                created_at = NOW() ,
                mem_image = ?
            WHERE id = ?
        `;
    
        await pool.query(sql, [full_name, email, mem_phone, mem_address1, mem_city, mem_state, mem_status, mem_image, id]);
    
    } catch (error) {
        console.error('Error updating member in database:', error.message);
        throw error; // Rethrow the error to catch it in the controller
    }
};
    // models/rider.js
static async deleteMemberById(id) {
    try {
        const [result] = await pool.query('DELETE FROM members WHERE id = ?', [id]);
        return result.affectedRows > 0; // Returns true if a row was deleted
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Failed to delete rider');
    }
}


}

module.exports = Member;
