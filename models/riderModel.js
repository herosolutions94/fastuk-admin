// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class RiderModel extends BaseModel {
    constructor() {
        super('riders'); // Pass the table name to the BaseModel constructor
    }

    // Method to check if an email exists (find by email)
    async findByEmail(email) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE email = ?`, [email]);
            return rows.length ? rows[0] : null; // Return the first result or null
        } catch (error) {
            throw new Error(`Error fetching rider by email from ${this.tableName}: ${error.message}`);
        }
    }

    // Method to check if an email already exists
    async emailExists(email) {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE email = ?`, [email]);
            return rows.length > 0; // Returns true if email exists, false otherwise
        } catch (error) {
            throw new Error(`Error checking if email exists in ${this.tableName}: ${error.message}`);
        }
    }

    // Method to create a new rider with validation
    async createRider(data) {
        if (await this.findByEmail(data.email)) {
            throw new Error(`Email ${data.email} is already in use.`);
        }

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(riderId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [riderId]);
        // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    // Function to update rider's verified status and set OTP to null
    async updateRiderVerification(riderId) {
        const query = `UPDATE riders SET mem_verified = 1, otp = NULL WHERE id = ?`;
        await pool.query(query, [riderId]);
    }

    async updateRiderData(riderId, data) {
        // Extract keys and values from the data object
        const keys = Object.keys(data); // ['otp', 'expire_time']
        const values = Object.values(data); // [newOtp, newExpireTime]

        // Construct the SET clause dynamically
        const setClause = keys.map(key => `${key} = ?`).join(', '); // e.g., "otp = ?, expire_time = ?"

        // Build the query dynamically
        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

        // Execute the query, adding the memberId to the values array
        await pool.query(query, [...values, riderId]);
    }
    async getRequestQuotesByCity (city) {
        const query = `
            SELECT * FROM request_quote
            WHERE source_city = ? AND assigned_rider IS NULL
        `;
        const [rows] = await pool.query(query, [city]); // Using promise wrapper
        return rows;
    };

    // Fetch vias for a request_quote
    async getViasByQuoteId  (quoteId)  {
    const query = `
        SELECT * FROM vias
        WHERE request_id = ?
    `;
    const [rows] = await pool.query(query, [quoteId]);
    return rows;
};

async updateOtp(memberId, otp) {
    const query = `UPDATE ${this.tableName} SET otp = ? WHERE id = ?`;
    const values = [otp, memberId];
    await pool.query(query, values); // Updates the OTP for the member
}
  

// Fetch parcels for a request_quote
async getParcelsByQuoteId (quoteId) {
    const query = `
        SELECT * FROM request_parcels
        WHERE request_id = ?
    `;
    const [rows] = await pool.query(query, [quoteId]);
    return rows;
};

async getRequestQuoteById(requestId) {
    const query = `SELECT * FROM request_quote WHERE id = ?`;
    const [rows] = await pool.query(query, [requestId]);
    return rows[0]; // Return the first row if it exists
}

async assignRiderAndUpdateStatus(requestId, riderId) {
    // Get current date in YYYY-MM-DD format
    const assignedDate = new Date().toISOString().split('T')[0];

    const query = `
        UPDATE request_quote 
        SET 
            assigned_rider = ?, 
            assigned_date = ?, 
            status = 'accepted' 
        WHERE 
            id = ? AND status = 'paid'`; // Ensure the current status is 'paid'

    const [result] = await pool.query(query, [riderId, assignedDate, requestId]);
    return result; // Contains affectedRows and other info
}

async getOrdersByRiderAndStatus({ riderId, status }) {
    try {
        const query = `
            SELECT 
                rq.*, 
                m.full_name AS user_name, 
                m.mem_image AS user_image,
                m.email AS user_email,
                m.mem_phone AS user_phone,
                COALESCE(SUM(rp.distance), 0) AS total_distance
            FROM 
                request_quote rq
            INNER JOIN 
                members m 
            ON 
                rq.user_id = m.id
            LEFT JOIN 
                request_parcels rp 
            ON 
                rq.id = rp.request_id
            WHERE 
                rq.assigned_rider = ? AND rq.status = ?
            GROUP BY 
                rq.id, m.full_name, m.mem_image, m.email, m.mem_phone
        `;
        const values = [riderId, status];
        const [rows] = await pool.query(query, values);
        console.log("orders rows:",rows)

        return rows; // Return the list of orders with user and parcel details
    } catch (err) {
        console.error("Error fetching orders:", err.message);
        throw new Error("Failed to fetch orders.");
    }
}

async getOrderDetailsById( {assignedRiderId, requestId}) {
    try {
        // Query to fetch the order by ID
        const query = `SELECT 
    rq.*, 
    m.full_name AS user_name, 
    m.mem_image AS user_image,
    m.email AS user_email,
    m.mem_phone AS user_phone,
    COALESCE(SUM(rp.distance), 0) AS total_distance
FROM 
    request_quote rq
INNER JOIN 
    members m 
ON 
    rq.user_id = m.id
LEFT JOIN 
    request_parcels rp 
ON 
    rq.id = rp.request_id
WHERE 
    rq.assigned_rider = ? 
    AND rq.id = ? 
    AND rq.status = 'accepted'  
GROUP BY 
    rq.id, m.full_name, m.mem_image, m.email, m.mem_phone;
`;
        
        // Execute the query using the connection pool
        const [rows, fields] = await pool.query(query, [assignedRiderId, requestId]);
        console.log("assignedRiderId:",assignedRiderId,"requestId:",requestId)
        console.log("rows:",rows)

        // If no rows are returned, the order doesn't exist
        if (rows.length === 0) {
            return null;
        }

        // Return the order details (first row since we expect a single result)
        return rows[0];
    } catch (error) {
        console.error("Error in getOrderDetailsById:", error);
        throw new Error("Database query failed.");
    }



}

}


module.exports = RiderModel;
