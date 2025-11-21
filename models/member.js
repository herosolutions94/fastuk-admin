const pool = require('../config/db-connection'); // Ensure this is promise-based
const helpers = require('../utils/helpers');

class Member {
    static async getAllMembers(conditions = []) {
    try {
        let query = 'SELECT * FROM members';
        let params = [];

        if (conditions.length > 0) {
            const conditionStrings = conditions.map(({ field, operator, value }) => {
                params.push(value);
                return `${field} ${operator} ?`;
            });

            query += ' WHERE ' + conditionStrings.join(' AND ');
        }

        const [rows] = await pool.query(query, params);
        return rows;
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
        const { full_name, email, mem_phone, mem_address1, mem_city, mem_state, mem_status, created_at, mem_image,mem_business_phone,
            mem_dob ,
            business_name ,
            business_type ,
            designation ,
            parcel_type ,
            parcel_weight ,
            shipment_volume ,
            delivery_speed } = memberData;
            // console.log("memberData:", memberData)
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
                mem_image = ?,
                mem_business_phone = ?,
                mem_dob = ?,
                business_name = ?,
                business_type = ?,
                designation = ?,
                parcel_type = ?,
                parcel_weight = ?,
                shipment_volume = ?,
                delivery_speed =?
            WHERE id = ?
        `;
    
        await pool.query(sql, [full_name, email, mem_phone, mem_address1, mem_city, mem_state, mem_status, mem_image,mem_business_phone,
            mem_dob ,
            business_name ,
            business_type ,
            designation ,
            parcel_type ,
            parcel_weight ,
            shipment_volume ,
            delivery_speed , id]);
    
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
        throw new Error('Failed to delete member');
    }
}

static async getStatesByCountryId(country_id) {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_states WHERE country_id = ?', [country_id]);
        return rows; // Return fetched states
    } catch (error) {
        console.error('Error fetching states:', error);
        throw error;
    }
}

static async findById(businessUserId) {
    const query = `SELECT * FROM members WHERE id = ?`;
    const [rows] = await pool.query(query, [businessUserId]);
    // console.log("Fetched user data from DB:", rows[0]); // Log the fetched data
return rows.length ? rows[0] : null; // Return the first result or null
}

static async updateBusinessUserApprove(id, is_approved) {
    try {
        // Update is_approved status
        const updateQuery = `UPDATE members SET is_approved = ? WHERE id = ?`;
        // console.log("Executing query:", updateQuery, "Values:", is_approved, id);
        await pool.query(updateQuery, [is_approved, id]);
                const createdDate = helpers.getUtcTimeInSeconds();
        

        if (is_approved === "approved") {
            // Insert into credits table
            const insertCreditsQuery = `INSERT INTO credits (user_id, credits, type, created_date, e_type) VALUES (?, ?, ?, ?, ?)`;
            await pool.query(insertCreditsQuery, [id, 200, 'admin', createdDate, 'credit']);

            // // Update credits in members table
            // const updateCreditsQuery = `UPDATE members SET credits = credits + 200 WHERE id = ?`;
            // await pool.query(updateCreditsQuery, [id]);

            // console.log(`200 credits added to user ${id}`);
        }
    } catch (error) {
        console.error("Database update error:", error);
        throw error;
    }
}
static async updateMemberData(memberId, data) {
        // Extract keys and values from the data object
        const keys = Object.keys(data); // ['otp', 'expire_time']
        const values = Object.values(data); // [newOtp, newExpireTime]

        // Construct the SET clause dynamically
        const setClause = keys.map(key => `${key} = ?`).join(', '); // e.g., "otp = ?, expire_time = ?"

        // Build the query dynamically
        const query = `UPDATE members SET ${setClause} WHERE id = ?`;

        // Execute the query, adding the memberId to the values array
        await pool.query(query, [...values, memberId]);
    }




}

module.exports = Member;
