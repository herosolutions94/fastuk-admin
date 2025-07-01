// models/RiderModel.js
const pool = require('../config/db-connection');
const helpers = require('../utils/helpers');
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
            const [rows] = await pool.query(`SELECT * FROM ${this.tableName} WHERE is_deleted !=1 AND email = ?`, [email]);
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
            WHERE source_city = ? AND assigned_rider IS NULL ORDER BY id DESC;
        `;
        // console.log(query,city)
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
    // console.log("vias rows:", rows)
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
async getParcelDetailsByQuoteId (quoteId) {
    const query = `
        SELECT * FROM order_details
        WHERE order_id = ?
    `;
    const [rows] = await pool.query(query, [quoteId]);
    return rows;
};

async getRequestQuoteById(requestId) {
    const query = `SELECT * FROM request_quote WHERE id = ?`;
    const [rows] = await pool.query(query, [requestId]);
    // console.log("Request:",rows)
    return rows[0]; // Return the first row if it exists
}

async assignRiderAndUpdateStatus(riderId, requestId) {
    // console.log(requestId,riderId)
    // Get current date in YYYY-MM-DD format
    const assignedDate = new Date().toISOString().split('T')[0];
    const updatedTime = helpers.getUtcTimeInSeconds();
    const endTime = helpers.addTwoDaysToDate();


    const query = `
        UPDATE request_quote 
        SET 
            assigned_rider = ?, 
            assigned_date = ?, 
            end_date = ?, 
            status = 'accepted',
            request_status = 'accepted',
            updated_time = ?  
        WHERE 
            id = ?`; // Ensure the current status is 'paid'

    const [result] = await pool.query(query, [riderId, assignedDate, endTime, updatedTime, requestId]);
    console.log("endTime:", endTime)
    return result; // Contains affectedRows and other info
}
async UpdateOrderStatus(riderId, requestId,request_status) {
    // console.log(requestId,riderId)
    // Get current date in YYYY-MM-DD format
    const status_date = new Date().toISOString().split('T')[0];
    const updatedTime = helpers.getUtcTimeInSeconds();


    const query = `
        UPDATE request_quote 
        SET 
            status_date = ?, 
            request_status = ?,
            updated_time = ?  
        WHERE 
            id = ?`;

    const [result] = await pool.query(query, [status_date, request_status,updatedTime, requestId]);
    return result; 
}

async getOrdersByRiderAndStatus({ riderId, status }) {
    try {
        let query = `
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
                rq.assigned_rider = ?
            
        `;
        const values = [riderId];

        if (status) {
      switch (status) {
        case 'completed':
          query += ` AND rq.status = ?`;
          values.push('completed');
          break;
        case 'in_progress':
          query += ` AND rq.status != ?`;
          values.push('completed');
          break;
        default:
          query += ` AND rq.status = ?`;
          values.push(status);
      }
    }

    query += `
      GROUP BY 
        rq.id, m.full_name, m.mem_image, m.email, m.mem_phone
      ORDER BY 
        rq.id DESC
    `;

          console.log("Fetching orders for rider:", riderId, "with status:", status);


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
GROUP BY 
    rq.id, m.full_name, m.mem_image, m.email, m.mem_phone;
`;
        
        // Execute the query using the connection pool
        const [rows, fields] = await pool.query(query, [assignedRiderId, requestId]);
        // console.log("assignedRiderId:",assignedRiderId,"requestId:",requestId)
        // console.log("rows:",rows)
        // console.log("query:",query)

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

async getRidersByCity(city) {
    const query = `SELECT id,email FROM riders WHERE city = ?`;
    const [rows] = await pool.query(query, [city]);
    return rows; // Returns an array of riders
  }
  async getWithdrawalPamentMethods(mem_id,type) {
    const query = `SELECT * FROM mem_withdrawal_methods WHERE mem_id = ? and payment_method = ?`;
    const [rows] = await pool.query(query, [mem_id,type]);
    return rows; // Returns an array of riders
  }
  async getOrderReviews(request_id) {
    const query = `
        SELECT 
            rr.*, 
            m.full_name, 
            m.mem_image 
        FROM 
            request_reviews rr
        INNER JOIN 
            members m 
        ON 
            rr.user_id = m.id
        WHERE 
            rr.request_id = ?
    `;
    const [rows] = await pool.query(query, [request_id]);
    return rows; // Returns an array of reviews with member details
}

  async getWithdrawalPamentMethodRow(mem_id,id) {
    const query = `SELECT * FROM mem_withdrawal_methods WHERE mem_id = ? and id = ?`;
    const [rows] = await pool.query(query, [mem_id,id]);
    return rows; // Returns an array of riders
  }

getRequestById = async (id, riderId) => {
    // console.log(id,riderId);return;
    const query = `
      SELECT 
        rq.*, 
        SUM(od.distance) AS total_distance 
      FROM 
        request_quote AS rq
      LEFT JOIN 
        order_details AS od 
        ON rq.id = od.order_id
      WHERE 
        rq.id = ? AND rq.assigned_rider = ?
      GROUP BY 
        rq.id
    `;
    const values = [id, riderId];
    const [rows] = await pool.query(query, values);
    return rows;
  };
  
 updateSourceRequestStatus = async (id, updates) => {
    const { is_picked, picked_time } = updates;
    const updatedTime = helpers.getUtcTimeInSeconds();

    const query = `
    UPDATE request_quote 
    SET is_picked = ?, picked_time = ? ,
    updated_time = ? 
    WHERE id = ? 
  `;
    const values = [is_picked, picked_time, updatedTime, id];
    const [rows] = await pool.query(query, values);
    return rows;
  };
  updateDestinationRequestStatus = async (id, updates) => {
    const { is_delivered, delivered_time } = updates;
    const updatedTime = helpers.getUtcTimeInSeconds();

    const query = `
    UPDATE request_quote 
    SET is_delivered = ?, delivered_time = ? ,
    updated_time = ?
    WHERE id = ? 
  `;
    const values = [is_delivered, delivered_time, updatedTime, id];
    const [rows] = await pool.query(query, values);
    return rows;
  };

  createInvoiceEntry = async (requestId, charges, amountType, status,type, via_id, paymentType,payment_intent_id, payment_method_id, payment_method) => {
    const ukDate = getUtcTimeInSeconds();
    // console.log([requestId, type, charges, amountType, status, ukDate, via_id, paymentType, payment_intent_id,payment_method_id, payment_method]);return;
    try {

        

      const query = `
        INSERT INTO invoices (request_id, type, amount, amount_type, status, created_date, via_id, payment_type, payment_intent_id, payment_method_id, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [requestId, type, charges, amountType, status, ukDate, via_id, paymentType, payment_intent_id,payment_method_id, payment_method];
    //   console.log("values:",values)
      
      // Execute the query to insert the data into the invoices table
      const [result] = await pool.query(query, values);
    //   console.log(result,"Result")
      // Return the result, typically the inserted record ID
      return result;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  };
  createWithdrawanMethod = async (data) => {
    const columns = Object.keys(data);
    const values = Object.values(data);

    // Generate the SQL query
    const placeholders = columns.map(() => '?').join(', '); // Creates `?` placeholders
    const query = `INSERT INTO mem_withdrawal_methods (${columns.join(', ')}) VALUES (${placeholders})`;


    try {
        const [result] = await pool.query(query, values);
        return result;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  };
createRequestReview = async (data) => {
    const columns = Object.keys(data);
    const values = Object.values(data);

    // Generate the SQL query
    const placeholders = columns.map(() => '?').join(', '); // Creates `?` placeholders
    const query = `INSERT INTO request_reviews (${columns.join(', ')}) VALUES (${placeholders})`;


    try {
        const [result] = await pool.query(query, values);
        return result;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  };
  updateWithdrawalMethod = async (data, whereCondition) => {
  // Extract columns and values from the data object
  const columns = Object.keys(data);
  const values = Object.values(data);

  // Generate the SQL query dynamically
  const setClause = columns.map((column) => `${column} = ?`).join(', ');

  // Assuming `whereCondition` is an object with one key-value pair, e.g., { id: 123 }
  const whereColumn = Object.keys(whereCondition)[0];
  const whereValue = Object.values(whereCondition)[0];

  const query = `UPDATE mem_withdrawal_methods SET ${setClause} WHERE ${whereColumn} = ?`;

  try {
    // Add the `whereValue` to the end of the values array
    const [result] = await pool.query(query, [...values, whereValue]);
    return result;
  } catch (error) {
    console.error('Error updating withdrawal method:', error);
    return null;
  }
};

deleteWithdrawalMethod = async (whereCondition) => {
  // Extract columns and values from the whereCondition object
  const whereColumns = Object.keys(whereCondition);
  const whereValues = Object.values(whereCondition);

  // Generate the WHERE clause dynamically
  const whereClause = whereColumns.map((column) => `${column} = ?`).join(' AND ');

  // Construct the SQL query
  const query = `DELETE FROM mem_withdrawal_methods WHERE ${whereClause}`;
// console.log(query,whereValues,whereCondition);return;
  try {
    const [result] = await pool.query(query, whereValues);
    return result;
  } catch (error) {
    console.error('Error deleting withdrawal method:', error);
    return null;
  }
};
getEarningsBefore3Days = async () => {
  const query = `
    SELECT *
FROM earnings
WHERE created_time <= UNIX_TIMESTAMP(UTC_TIMESTAMP()) - (3 * 24 * 60 * 60) AND status='pending'
  `;

  try {
    const [results] = await pool.query(query);
    return results;
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }
};
getAllEarnings = async () => {
  const query = `
    SELECT
    e.id AS id,
    e.user_id,
    e.amount,
    e.type,
    e.status,
    e.created_time,
    r.id AS rider_id,
    r.full_name AS rider_name,
    r.mem_image AS mem_image
FROM earnings e
JOIN riders r ON e.user_id = r.id
ORDER BY e.created_time DESC;
  `;

  try {
    const [results] = await pool.query(query);
    return results;
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }
};
static async getEarningById(id) {
    const [transaction] = await pool.query(
      `SELECT * FROM earnings WHERE id = ?`,
      [id]
    );
    return transaction; // This should be an object, not an array
  }
  static async updateEarningData(id, data) {
        // Extract keys and values from the data object
        const keys = Object.keys(data); // ['otp', 'expire_time']
        const values = Object.values(data); // [newOtp, newExpireTime]

        // Construct the SET clause dynamically
        const setClause = keys.map(key => `${key} = ?`).join(', '); // e.g., "otp = ?, expire_time = ?"

        // Build the query dynamically
        const query = `UPDATE earnings SET ${setClause} WHERE id = ?`;

        // Execute the query, adding the memberId to the values array
        await pool.query(query, [...values, id]);
    }
async updateEarningStatusToCleared(earningId) {
  const query = `UPDATE earnings SET status = 'cleared' WHERE id = ?`;

  try {
    const [result] = await pool.query(query, [earningId]);
    return result;
  } catch (error) {
    console.error(`Error updating status for ID ${earningId}:`, error);
    return null;
  }
}

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
    const updatedTime = helpers.getUtcTimeInSeconds();

    const query = `
      UPDATE request_quote 
      SET source_completed = 1 ,
       updated_time = ?
      WHERE id = ? 
    `;
    
    const values = [updatedTime, id];
    
    const [rows] = await pool.query(query, values);
    
    return rows; // This returns the number of affected rows
  };

  async updateRequestQuoteTime(requestId) {
    try {
        const query = `
            UPDATE request_quote
            SET updated_time = ?
            WHERE id = ?;
        `;

        // Get the current UTC time in seconds
        const updatedTime = helpers.getUtcTimeInSeconds();

        // Execute the query
        const [result] = await pool.query(query, [updatedTime, requestId]);

        return result.affectedRows > 0; // Return true if the row was updated
    } catch (error) {
        console.error("Error updating updated_time in request_quote:", error);
        throw error; // Re-throw the error for higher-level handling
    }
}

  updateRequestQuoteDestinationCompleted = async (id) => {

    const updatedTime = helpers.getUtcTimeInSeconds();

    const query = `
      UPDATE request_quote 
      SET finished = 1 ,
      updated_time = ?
      WHERE id = ? 
    `;
    
    const values = [updatedTime, id];
    
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
 getInvoicesById = async (invoice_id) => {
    try {
        const query = 'SELECT * FROM invoices WHERE id = ?';
        const [rows] = await pool.query(query, [invoice_id]);
        return rows.length > 0 ? rows[0] : null; // Returns the list of invoices
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw new Error("Failed to fetch invoices");
    }
};
async updateRequestInvoice(invoice_id, data) {
        // Extract keys and values from the data object
        const keys = Object.keys(data); // ['otp', 'expire_time']
        const values = Object.values(data); // [newOtp, newExpireTime]

        // Construct the SET clause dynamically
        const setClause = keys.map(key => `${key} = ?`).join(', '); // e.g., "otp = ?, expire_time = ?"

        // Build the query dynamically
        const query = `UPDATE invoices SET ${setClause} WHERE id = ?`;

        // Execute the query, adding the memberId to the values array
        await pool.query(query, [...values, invoice_id]);
    }

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
        GROUP BY r.id, i.type, i.via_id, r.source_address, r.dest_address, v.address
        ORDER BY i.id ASC;
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


async  getDueAmountByRequestId(requestId) {
    try {
      // Query to sum the amount where status = 0
      const query = 'SELECT SUM(amount) AS dueAmount FROM invoices WHERE request_id = ? AND status = 0';
      
      // Execute the query using the connection pool
      const [rows] = await pool.query(query, [requestId]);
  
      // If rows contain results, return the sum of the amount
      if (rows && rows.length > 0) {
        return rows[0].dueAmount || 0; // Return the sum or 0 if no amounts are found
      }
  
      return 0; // Default value if no due amount is found
    } catch (error) {
      console.error("Error fetching due amount:", error);
      throw new Error("Failed to fetch due amount.");
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
      
    //   console.log("Raw rows result:", rows);
      return rows[0].viasCount; // Extract the count value
    } catch (error) {
      console.error("Error fetching vias count:", error);
      throw error;
    }
  }

  async updateTempEmail(id, temp_email) {
    const query = `
        UPDATE riders
        SET temp_email = ?
        WHERE id = ?;
    `;
    const values = [temp_email, id];
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
        throw new Error("Rider not found or update failed.");
    }

    return result.affectedRows;
}

// Get the last 3 completed orders for the rider
async getCompletedOrdersByRider(riderId) {
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
      ORDER BY 
        rq.id DESC 
      LIMIT 3
    `;
    const values = [riderId, 'completed']; // Provide both values for placeholders
  
    try {
      const [rows] = await pool.query(query, values);
      return rows;
    } catch (error) {
      console.error("Error fetching completed orders:", error.message);
      throw new Error("Database query failed.");
    }
  }
  
  
  // Get the total count of all orders for a rider with status 'completed' or 'accepted'
  async getTotalOrdersByStatus(riderId) {
    const query = `
      SELECT COUNT(*) AS total_orders
      FROM request_quote
      WHERE assigned_rider = ? AND (status = 'completed' OR status = 'accepted')
    `;
    const values = [riderId];
  
    try {
      const [rows] = await pool.query(query, values);
      return rows[0].total_orders; // Return the total count
    } catch (error) {
      console.error("Error fetching total orders:", error.message);
      throw new Error("Database query failed.");
    }
  }
  
  // Get the total count of completed orders for a rider
  async getTotalCompletedOrders(riderId) {
    const query = `
      SELECT COUNT(*) AS total_completed_orders
      FROM request_quote
      WHERE assigned_rider = ? AND status = 'completed'
    `;
    const values = [riderId];
  
    try {
      const [rows] = await pool.query(query, values);
      return rows[0].total_completed_orders; // Return the total count of completed orders
    } catch (error) {
      console.error("Error fetching total completed orders:", error.message);
      throw new Error("Database query failed.");
    }
  }

  async getRiderEarnings(riderId) {
    try {
      // Get earnings where the status is 'cleared' for Net Income
      const [netIncomeResult] = await pool.query(
        `SELECT SUM(amount) as net_income FROM earnings WHERE user_id = ? and type='credit'`,
        [riderId]
      );
  
      // Get available balance: sum of all 'credit' earnings - sum of all 'debit' earnings
      const [availableBalanceResult] = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'cleared' THEN amount ELSE 0 END), 0) 
          - 
          COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'cleared' THEN amount ELSE 0 END), 0) 
          AS available_balance 
        FROM earnings 
        WHERE user_id = ?`,
        [riderId]
      );
      

      // Get total withdrawn amount from withdraw_requests table
      const [withdrawnAmountResult] = await pool.query(
        `SELECT SUM(amount) AS total_withdrawn 
         FROM withdraw_requests 
         WHERE user_id = ? AND status = 'cleared'`,
        [riderId]
      );
      // console.log("withdrawnAmountResult:",withdrawnAmountResult)
      
  
      // Get all earnings data for the rider
      const [earnings] = await pool.query('SELECT * FROM earnings WHERE user_id = ? ORDER BY id DESC', [riderId]);
  
      // Return the calculated values along with the earnings data
      return {
        netIncome: netIncomeResult[0].net_income || 0, // Default to 0 if no result
        availableBalance: availableBalanceResult[0].available_balance || 0, // Default to 0 if no result
        totalWithdrawn: withdrawnAmountResult[0].total_withdrawn || 0, // Default to 0 if no result
        earnings: earnings
      };
    } catch (error) {
      console.error('Error fetching earnings:', error);
      throw error;
    }
  }

  async createWithdrawalRequest({ riderId, earning_id, payment_method, account_details, paypal_details, amount }) {
    try {
      // console.log("Model Params:", {
      //   riderId,
      //   payment_method,
      //   account_details,
      //   paypal_details,
      //   amount,
      // });
      const query = `
        INSERT INTO withdraw_requests 
        (user_id, earning_id, account_details, paypal_details, amount, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        riderId,
        earning_id,
        payment_method === 'bank-account' ? JSON.stringify(account_details) : null,
        payment_method === 'paypal' ? paypal_details : null,
        amount,
        'pending', // Default status
        helpers.getUtcTimeInSeconds(), // created_at
        helpers.getUtcTimeInSeconds(), // updated_at
      ];

      
  
      const [result] = await pool.query(query, values); // Assuming you're using a MySQL pool
      // console.log("result:",result,"values:",values)
      return result; // Return the inserted row
    } catch (error) {
      console.error("Error inserting withdrawal request:", error);
      return null;
    }
  }

  async getClearedEarnings(userId) {
    try {
      const query = `
        SELECT * 
        FROM earnings 
        WHERE user_id = ? 
          AND type = 'credit' 
          AND status = 'cleared'
      `;
      const [results] = await pool.query(query, [userId]); // Assuming you're using a MySQL pool
      return results;
    } catch (error) {
      console.error("Error fetching cleared earnings:", error);
      return null;
    }
  }

  async updateDrivingLicense  (riderId, filename) {
    const sql = "UPDATE riders SET driving_license = ? WHERE id = ?";
    return pool.query(sql, [filename, riderId]);
  }

  async getRiderLicenseById(riderId) {
  const [rows] = await pool.query("SELECT driving_license FROM riders WHERE id = ?", [riderId]);
  return rows.length ? rows[0] : null;
}


  async createWithdrawDetail(withdrawalId, earningId, created_at, updated_at) {
    const query = `
      INSERT INTO withdraw_details (w_id, earning_id, created_at, updated_at)
      VALUES (?, ?, ?, ?);
    `;
    const values = [withdrawalId, earningId, created_at, updated_at];
    try {
      const [result] = await pool.query(query, values); // Assuming you're using a MySQL pool
      return result;
    } catch (error) {
      console.error("Error in createWithdrawDetail:", error);
      throw new Error("Failed to create withdraw detail.");
    }
  }

  async insertRiderAttachment({ rider_id, filename, type }) {
    const query = `
      INSERT INTO rider_attachments (rider_id, filename, type)
      VALUES (?, ?, ?)
    `;
    const values = [rider_id, filename, type];
    console.log("values:",values)
    await pool.query(query, values);
  }

  async createAttachments(attachments) {
    const values = attachments.map(att => `('${att.rider_id}', '${att.filename}', '${att.type}')`).join(',');
    const query = `INSERT INTO rider_attachments (rider_id, filename, type) VALUES ${values}`;
    console.log("values:",values)
    await pool.query(query);
  }


  async getRiderAttachments(riderId) {
    const query = `SELECT * FROM rider_attachments WHERE rider_id = ?`;
    const values = [riderId];
    console.log("riderId:",riderId)
    const [rows] = await pool.query(query, values); // Destructure only the rows
    console.log("rows:", rows); // This should now log actual data
    return rows;
  }

  async deleteAttachments(riderId) {
    const query = "DELETE FROM rider_attachments WHERE rider_id = ?";
    await pool.query(query, [riderId]);
  }
  
  async insertAttachment(riderId, filename, type) {
    const query = "INSERT INTO rider_attachments (rider_id, filename, type) VALUES (?, ?, ?)";
    await pool.query(query, [riderId, filename, type]);
  }

  async getSubCategoriesByRiderId(riderId) {
  const query = `
    SELECT v.id
    FROM rider_vehicle_categories rvc
    JOIN vehicle_categories v ON v.id = rvc.category_id
    WHERE rvc.rider_id = ?
  `;
  const [rows] = await pool.query(query, [riderId]);
  console.log("rows:",rows)

  return rows.map(row => row.id); // Return only names in array
}


  
  
  
  
  
  
  
  


  
  
  
  
  

  










  

}


module.exports = RiderModel;
