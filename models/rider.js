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
        const { full_name, email, mem_phone, dob, mem_address1, city, vehicle_owner, vehicle_type, vehicle_registration_num, driving_license_num, status, driving_license } = riderData;
        await pool.query(
            'UPDATE riders SET full_name = ?, email = ?, mem_phone = ?, dob = ?, mem_address1 = ?, city = ?, vehicle_owner = ?, vehicle_type = ?, vehicle_registration_num = ?, driving_license_num = ?, status = ?, driving_license = ? WHERE id = ?',
            [full_name, email, mem_phone, dob, mem_address1, city, vehicle_owner, vehicle_type, vehicle_registration_num, driving_license_num, status, driving_license, id]
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

static async create({ rider_id, title, status, description }) {
    const query = `
        INSERT INTO rider_documents (rider_id, title, status, description) 
        VALUES (?, ?, ?, ?)
    `;
    await pool.query(query, [rider_id, title, 'requested', description]);
}

static async getDocuments(rider_id = null) {
    let query = `SELECT * FROM rider_documents`;
    let params = [];

    if (rider_id) {
        query += ` WHERE rider_id = ? ORDER BY created_at DESC`;
        params.push(rider_id);
    } else {
        query += ` ORDER BY created_at DESC`;
    }

    const [rows] = await pool.query(query, params);
    // console.log("rows:",rows)
    return rows;
}

static async getDocumentById(document_id) {
    const query = `SELECT * FROM rider_documents WHERE id = ?`;
    const [rows] = await pool.query(query, [document_id]);
    return rows.length ? rows[0] : null;
}
static async getDocumentByIdAndRiderId(id, riderId) {
    const query = `SELECT * FROM rider_documents WHERE id = ? AND rider_id = ?`;
    const [rows] = await pool.query(query, [id, riderId]);
    return rows; // Return full array instead of first object
}

static async updateDocument(document_id, title, description) {
    const query = `UPDATE rider_documents SET title = ?, description = ? WHERE id = ?`;
    await pool.query(query, [title, description, document_id]);
}
static async updateDocumentNameAndStatus(encryptedFileName, id) {
    const query = `UPDATE rider_documents SET document_name = ?, status = 'pending' WHERE id = ?`;
    await pool.query(query, [encryptedFileName, id]);
}
static async updateDocumentStatus(id, status) {
    const query = `UPDATE rider_documents SET status = ? WHERE id = ?`;
    await pool.query(query, [status, id]);
}


static async deleteDocument(document_id, rider_id) {
    const query = `DELETE FROM rider_documents WHERE id = ? AND rider_id = ?`;
    await pool.query(query, [document_id, rider_id]);
}

static async findById(riderId) {
    const query = `SELECT * FROM riders WHERE id = ?`;
    const [rows] = await pool.query(query, [riderId]);
    // console.log(rows)
return rows.length ? rows[0] : null; // Return the first result or null
}

static async updateRiderApprove(id, is_approved) {
  const query = `UPDATE riders SET is_approved = ? WHERE id = ?`;
  console.log(query)
  await pool.query(query, [is_approved, id]);
}





}

module.exports = Rider;
