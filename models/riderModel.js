// models/RiderModel.js
const pool = require('../config/db-connection');
const { getUtcTimeInSeconds } = require('../utils/helpers');
const BaseModel = require('./baseModel');
const moment = require('moment');


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
        // console.log("orders rows:",rows)

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
        // console.log("assignedRiderId:",assignedRiderId,"requestId:",requestId)
        // console.log("rows:",rows)

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

getRequestById = async (id, riderId) => {
    const query = `
      SELECT * FROM request_quote 
      WHERE id = ? AND assigned_rider = ?
    `;
    const values = [id, riderId];
    const [rows] = await pool.query(query, values);
    return rows;
  };
  
 updateSourceRequestStatus = async (id, updates) => {
    const { is_picked, picked_time } = updates;
    const query = `
    UPDATE request_quote 
    SET is_picked = ?, picked_time = ? 
    WHERE id = ? 
  `;
    const values = [is_picked, picked_time, id];
    const [rows] = await pool.query(query, values);
    return rows;
  };
  updateDestinationRequestStatus = async (id, updates) => {
    const { is_delivered, delivered_time } = updates;
    const query = `
    UPDATE request_quote 
    SET is_delivered = ?, delivered_time = ? 
    WHERE id = ? 
  `;
    const values = [is_delivered, delivered_time, id];
    const [rows] = await pool.query(query, values);
    return rows;
  };

  createInvoiceEntry = async (requestId, charges, amountType,loc_type, via_id) => {
    try {

        const ukDate = getUtcTimeInSeconds();

      const query = `
        INSERT INTO invoices (request_id, type, amount, amount_type, status, created_date, via_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [requestId, loc_type, charges, amountType, 'pending', ukDate, via_id];
      
      // Execute the query to insert the data into the invoices table
      const [result] = await pool.query(query, values);
  
      // Return the result, typically the inserted record ID
      return result;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  };

  async getViaByIdAndRequestId(via_id, request_id) {
    try {
      // Query to fetch via by via_id and request_id
      const query = `
        SELECT * 
        FROM vias
        WHERE id = ? AND request_id = ?;
      `;

      // Execute the query
      const [rows] = await pool.query(query, [via_id, request_id]);

      // If no rows are returned, return null
      if (rows.length === 0) {
        return null;
      }

      // Return the first matching row (since the query assumes unique via_id and request_id)
      return rows[0];
    } catch (error) {
      console.error('Error fetching via by ID and request ID:', error);
      throw new Error('Error fetching via');
    }
  }

  
  updateRequestQuoteSourceCompleted = async (id) => {
    const query = `
      UPDATE request_quote 
      SET source_completed = 1 
      WHERE id = ? 
    `;
    
    const values = [id];
    
    const [rows] = await pool.query(query, values);
    
    return rows; // This returns the number of affected rows
  };
  updateRequestQuoteDestinationCompleted = async (id) => {
    const query = `
      UPDATE request_quote 
      SET finished = 1 
      WHERE id = ? 
    `;
    
    const values = [id];
    
    const [rows] = await pool.query(query, values);
    
    return rows; // This returns the number of affected rows
  };

  getInvoicesByRequestId = async (requestId) => {
    try {
        const query = 'SELECT * FROM invoices WHERE request_id = ?';
        const [rows] = await pool.query(query, [requestId]);
        return rows; // Returns the list of invoices
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw new Error("Failed to fetch invoices");
    }
};

async getViaByRequestAndId(requestId, viaId) {
    try {
        const query = `
            SELECT * 
            FROM vias 
            WHERE request_id = ? AND id = ?;
        `;
        const [rows] = await pool.query(query, [requestId, viaId]);
        return rows.length > 0 ? rows[0] : null; // Return the first row if found, else null
    } catch (error) {
        console.error("Error fetching via by request and ID:", error);
        throw error;
    }
}

async updateViaStatus(viaId, updateData) {
    try {
        const query = `
            UPDATE vias 
            SET is_picked = ?, picked_time = ? 
            WHERE id = ?;
        `;
        const [result] = await pool.query(query, [
            updateData.is_picked,
            updateData.picked_time,
            viaId,
        ]);

        return result.affectedRows > 0; // Return true if rows were updated
    } catch (error) {
        console.error("Error updating via status:", error);
        throw error;
    }
}


updateViaSourceCompleted = async (id) => {
    const query = `
      UPDATE vias 
      SET source_completed = 1 
      WHERE id = ? 
    `;
    
    const values = [id];
    
    const [rows] = await pool.query(query, values);
    
    return rows; // This returns the number of affected rows
  };

  async getInvoicesDetailsByRequestId(requestId) {
    const query = `
        SELECT 
            r.id AS request_id,
            i.type,
            i.via_id,
            MAX(CASE WHEN i.amount_type = 'handball' THEN i.amount ELSE NULL END) AS handball_charges,
            MAX(CASE WHEN i.amount_type = 'waiting' THEN i.amount ELSE NULL END) AS waiting_charges,
            CASE
                WHEN i.type = 'source' THEN r.source_address
                WHEN i.type = 'destination' THEN r.dest_address
                WHEN i.type = 'via' THEN v.address
            END AS address
        FROM invoices i
        JOIN request_quote r ON i.request_id = r.id
        LEFT JOIN vias v ON i.via_id = v.id
        WHERE r.id = ?
        GROUP BY r.id, i.type, i.via_id, r.source_address, r.dest_address, v.address;
    `;
    try {
        const [rows] = await pool.query(query, [requestId]);
        
        // If rows are found, you can map them to the required format
        const invoices = rows.map(row => {
            return {
                request_id: row.request_id,
                type: row.type,
                via_id: row.via_id,
                handball_charges: row.handball_charges,
                waiting_charges: row.waiting_charges,
                address: row.address ? row.address : null // Ensures no undefined addresses
            };
        });

        return invoices;
    } catch (error) {
        throw new Error(`Error fetching grouped invoices: ${error.message}`);
    }
}

 async countViasBySourceCompleted(requestId) {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS viasCount
         FROM vias
         WHERE request_id = ? AND (source_completed = 0 || source_completed = null)`,
        [requestId] // Provide the requestId as an array
      );
      
      console.log("Raw rows result:", rows);
      return rows[0].viasCount; // Extract the count value
    } catch (error) {
      console.error("Error fetching vias count:", error);
      throw error;
    }
  }
  










  

}


module.exports = RiderModel;
