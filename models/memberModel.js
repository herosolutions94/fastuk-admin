// models/RiderModel.js
const pool = require("../config/db-connection");
const helpers = require("../utils/helpers");
const BaseModel = require("./baseModel");
const moment = require("moment");

class MemberModel extends BaseModel {
  constructor() {
    super("members"); // Pass the table name to the BaseModel constructor
  }

  // Method to check if an email exists (find by email)
  async findByEmail(email) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE is_deleted != 1 AND email = ?`,
        [email]
      );
      return rows.length ? rows[0] : null; // Return the first result or null
    } catch (error) {
      throw new Error(
        `Error fetching member by email from ${this.tableName}: ${error.message}`
      );
    }
  }
  async findByPhone(mem_phone) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE is_deleted != 1 AND mem_phone = ?`,
        [mem_phone]
      );
      return rows.length ? rows[0] : null; // Return the first result or null
    } catch (error) {
      throw new Error(
        `Error fetching member by phone from ${this.tableName}: ${error.message}`
      );
    }
  }

  async findByOtp(otp) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE otp = ?`,
        [otp]
      );
      return rows.length ? rows[0] : null; // Return the first result or null
    } catch (error) {
      throw new Error(
        `Error fetching member by otp from ${this.tableName}: ${error.message}`
      );
    }
  }

  // Method to check if an email already exists
  async emailExists(email) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE email = ?`,
        [email]
      );
      return rows.length > 0; // Returns true if email exists, false otherwise
    } catch (error) {
      throw new Error(
        `Error checking if email exists in ${this.tableName}: ${error.message}`
      );
    }
  }

  // Method to create a new rider with validation
  async createMember(data) {
    // console.log('Attempting to insert user:', data); // Log the data to insert

    if (await this.findByEmail(data.email)) {
      throw new Error(`Email ${data.email} is already in use.`);
    }

    try {
      const userId = await this.create(data); // Call the BaseModel's create method
      // console.log('Inserted user ID:', userId); // Log the inserted ID
      return userId;
    } catch (error) {
      console.error("Error creating member:", error.message); // Log the error
      throw error;
    }
  }

  async findById(memberId) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const [rows] = await pool.query(query, [memberId]);
    // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
  }

  // Function to update rider's verified status and set OTP to null
  async updateMemberVerification(memberId) {
    const query = `UPDATE members SET mem_verified = 1, otp = NULL WHERE id = ?`;
    await pool.query(query, [memberId]);
  }
  async updateMemberData(memberId, data) {
    // Extract keys and values from the data object
    const keys = Object.keys(data); // ['otp', 'expire_time']
    const values = Object.values(data); // [newOtp, newExpireTime]

    // Construct the SET clause dynamically
    const setClause = keys.map((key) => `${key} = ?`).join(", "); // e.g., "otp = ?, expire_time = ?"

    // Build the query dynamically
    const query = `UPDATE members SET ${setClause} WHERE id = ?`;

    // Execute the query, adding the memberId to the values array
    await pool.query(query, [...values, memberId]);
  }
  async updateRequestQuoteData(requestId, data) {
    // Extract keys and values from the data object
    const keys = Object.keys(data); // ['otp', 'expire_time']
    const values = Object.values(data); // [newOtp, newExpireTime]

    // Construct the SET clause dynamically
    const setClause = keys.map((key) => `${key} = ?`).join(", "); // e.g., "otp = ?, expire_time = ?"

    // Build the query dynamically
    const query = `UPDATE request_quote SET ${setClause} WHERE id = ?`;

    // Execute the query, adding the memberId to the values array
    await pool.query(query, [...values, requestId]);
  }

  async updateOtp(memberId, otp) {
    const query = "UPDATE members SET otp = ? WHERE id = ?";
    const values = [otp, memberId];
    await pool.query(query, values); // Updates the OTP for the member
  }
  async updatePassword(memberId, hashedPassword) {
    const query = `UPDATE ${this.tableName} SET password = ? WHERE id = ?`;
    await pool.query(query, [hashedPassword, memberId]);
  }

  async updateMemberImage(userId, imageUrl) {
    const query = `UPDATE ${this.tableName} SET mem_image = ? WHERE id = ? RETURNING mem_image`;
    const values = [imageUrl, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  async getUserInvoices(userId) {
    const query = `
        SELECT i.*
        FROM invoices i
        JOIN request_quote r ON i.request_id = r.id
        WHERE r.user_id = ?
        GROUP BY r.id;
    `;
    try {
      const [rows] = await pool.query(query, [userId]);

      return rows;
    } catch (error) {
      throw new Error(`Error fetching grouped invoices: ${error.message}`);
    }
  }
  async getOrdersByUserAndStatus({ userId, status = "", limit = null }) {
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
            LEFT JOIN 
                riders m 
            ON 
                rq.assigned_rider = m.id AND rq.assigned_rider IS NOT NULL
            LEFT JOIN 
                request_parcels rp 
            ON 
                rq.id = rp.request_id
            WHERE 
                rq.user_id = ?
        `;

      const values = [userId];

      // Add status condition if it's not empty
      if (status) {
        switch (status) {
          case "completed":
            query += ` AND rq.status = ?`;
            values.push("completed");
            break;
          case "in_progress":
            // Assuming anything not completed is in progress
            query += ` AND rq.status != ?`;
            values.push("completed");
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

      console.log("Fetching orders for user:", userId, "with status:", status);

      // Add LIMIT clause if limit is not null
      if (limit !== null) {
        query += ` LIMIT ?`;
        values.push(limit);
      }

      const [rows] = await pool.query(query, values);

      return rows; // Return the list of orders with user and parcel details
    } catch (err) {
      console.error("Error fetching orders:", err.message);
      throw new Error("Failed to fetch orders.");
    }
  }

  async getUserOrderDetailsById({ userId, requestId }) {
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
LEFT JOIN 
                riders m 
            ON 
                rq.assigned_rider = m.id AND rq.assigned_rider IS NOT NULL
LEFT JOIN 
    request_parcels rp 
ON 
    rq.id = rp.request_id
WHERE 
    rq.user_id = ? 
    AND rq.id = ? 
    AND rq.status != 'pending'  
GROUP BY 
    rq.id, m.full_name, m.mem_image, m.email, m.mem_phone;
`;

      // Execute the query using the connection pool
      const [rows, fields] = await pool.query(query, [userId, requestId]);
      // console.log("userId:",userId,"requestId:",requestId)
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
  async getUserOrderDetailsByTrackingId({ tracking_id }) {
    try {
      // Query to fetch order, rider, and user details
      const query = `
            SELECT 
                rq.*, 
                r.full_name AS rider_name,  
                r.mem_image AS rider_image, 
                r.email AS rider_email,
                r.mem_phone AS rider_phone,
                m.full_name AS user_name,
                m.mem_image AS user_image,
                m.email AS user_email,
                m.mem_phone AS user_phone,
                COALESCE(SUM(rp.distance), 0) AS total_distance
            FROM 
                request_quote rq
            LEFT JOIN 
                riders r 
                ON rq.assigned_rider = r.id AND rq.assigned_rider IS NOT NULL
            LEFT JOIN 
                members m 
                ON rq.user_id = m.id  
            LEFT JOIN 
                request_parcels rp 
                ON rq.id = rp.request_id
            WHERE 
                rq.tracking_id = ?   
            GROUP BY 
                rq.id, r.full_name, r.mem_image, r.email, r.mem_phone, 
                m.full_name, m.mem_image, m.email, m.mem_phone;
        `;

      // Execute the query
      const [rows, fields] = await pool.query(query, [tracking_id]);

      // If no rows are returned, the order doesn't exist
      if (rows.length === 0) {
        return null;
      }

      // Return the order details (first row)
      return rows[0];
    } catch (error) {
      console.error("Error in getUserOrderDetailsByTrackingId:", error);
      throw new Error("Database query failed.");
    }
  }

  async getOrderDetailsById({ requestId }) {
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
LEFT JOIN 
                riders m 
            ON 
                rq.assigned_rider = m.id AND rq.assigned_rider IS NOT NULL
LEFT JOIN 
    request_parcels rp 
ON 
    rq.id = rp.request_id
WHERE 
    rq.id = ? 
    AND rq.status != 'pending'  
GROUP BY 
    rq.id, m.full_name, m.mem_image, m.email, m.mem_phone;
`;

      // Execute the query using the connection pool
      const [rows, fields] = await pool.query(query, [requestId]);
      // console.log("userId:",userId,"requestId:",requestId)
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
  async updateRequestData(requestId, data) {
    const keys = Object.keys(data); // ['otp', 'expire_time']
    const values = Object.values(data); // [newOtp, newExpireTime]

    const setClause = keys.map((key) => `${key} = ?`).join(", "); // e.g., "otp = ?, expire_time = ?"

    const query = `UPDATE request_parcels SET ${setClause} WHERE id = ?`;

    await pool.query(query, [...values, requestId]);
  }

  async getUnreadNotificationsCount({ userId, memType }) {
    try {
      const query = `
            SELECT COUNT(*) AS unreadCount
            FROM notifications
            WHERE user_id = ? AND mem_type = ? AND status = 0
        `;
      const [result] = await pool.query(query, [userId, memType]);
      return result[0]?.unreadCount || 0;
    } catch (error) {
      console.error("Error in getUnreadNotificationsCount:", error);
      throw error; // Let the controller handle the error
    }
  }
  async getNotifications(userId, memType) {
    const query = `
      SELECT 
        n.*, 
        CASE 
          WHEN n.mem_type = 'user' THEN r.mem_image
          WHEN n.mem_type = 'rider' THEN m.mem_image
          ELSE NULL 
        END AS sender_dp,
        CASE 
          WHEN n.mem_type = 'user' THEN r.full_name
          WHEN n.mem_type = 'rider' THEN m.full_name
          ELSE NULL 
        END AS sender_name
      FROM notifications n
      LEFT JOIN riders r ON n.sender = r.id AND n.mem_type = 'user'
      LEFT JOIN members m ON n.sender = m.id AND n.mem_type = 'rider'      
WHERE n.user_id = ? AND n.mem_type = ? 
      ORDER BY n.created_date DESC
    `;
    const values = [userId, memType];

    try {
      const [rows] = await pool.query(query, values);
      //   console.log("Notification rows:",rows)
      return rows;
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
      throw new Error("Database query failed.");
    }
  }

  async getNotificationById(id) {
    const query = `SELECT * FROM notifications WHERE id = ?`;
    const [rows] = await pool.query(query, [id]);
    console.log("rows:", rows);
    return rows.length ? rows[0] : null;
  }

  static async deleteNotification(id) {
    const query = "DELETE FROM notifications WHERE id = ?;";
    await pool.query(query, [id]);
  }
  async getLatestNotifications(userId, memType) {
    try {
      const query =
        "SELECT * FROM notifications WHERE user_id = ? AND mem_type = ? ORDER BY id DESC LIMIT 3";
      const [rows] = await pool.query(query, [userId, memType]); // Use correct query execution
      return rows; // Return the result
    } catch (error) {
      console.error("Error fetching latest notifications:", error);
      return []; // Return an empty array on error
    }
  }

  static async updateTempEmail(id, temp_email) {
    const query = `
        UPDATE members
        SET temp_email = ?
        WHERE id = ?;
    `;
    const values = [temp_email, id];
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      throw new Error("Member not found or update failed.");
    }

    return result.affectedRows;
  }

  static async createReview(orderId, userId, rating, message) {
    try {
      // Insert the review into the reviews table
      const query = `
        INSERT INTO reviews (order_id, user_id, rating, message, created_at)
        VALUES (?, ?, ?, ?, NOW());
      `;
      const [result] = await pool.query(query, [
        orderId,
        userId,
        rating,
        message,
      ]);

      // Optionally, retrieve the inserted review if needed (based on the auto-increment ID)
      const reviewId = result.insertId;

      // Fetch the inserted review (optional)
      const selectQuery = "SELECT * FROM reviews WHERE id = ?";
      const [review] = await db.execute(selectQuery, [reviewId]);

      return review[0]; // Return the first (and only) row
    } catch (error) {
      console.error("Error creating review:", error);
      throw new Error("Failed to post review");
    }
  }

  async getApprovedBusinessUsers() {
    return pool.query(
      "SELECT id FROM members WHERE is_approved = 'approved' AND mem_type = 'business'"
    );
  }

  async checkExistingInvoice(userId) {
    const currentMonth = moment().format("YYYY-MM"); // Current Year-Month

    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM credit_invoices 
         WHERE user_id = ? 
         AND DATE_FORMAT(FROM_UNIXTIME(created_date), '%Y-%m') = ?`,
      [userId, currentMonth]
    );

    return rows[0].count > 0; // Returns true if at least one invoice exists
  }
  async checkExistingMonthCredits(userId) {
    const currentMonth = moment().format("YYYY-MM"); // Current Year-Month

    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM credits 
         WHERE user_id = ? AND type='admin' and e_type='credit'
         AND DATE_FORMAT(FROM_UNIXTIME(created_date), '%Y-%m') = ?`,
      [userId, currentMonth]
    );

    return rows[0].count > 0; // Returns true if at least one invoice exists
  }

  async getTotalDebitCredits(userId) {
    const [rows] = await pool.query(
      `SELECT SUM(credits) AS totalDebit FROM credits 
         WHERE user_id = ? AND e_type = 'debit'`,
      [userId]
    );
    // console.log("rows:",rows,userId)

    return rows[0].totalDebit || 0; // Return 0 if no debits found
  }

  async insertInvoice(userId, amount = 100) {
    const createdDate = helpers.getUtcTimeInSeconds();
    amount = amount.toFixed(2);
    const newInvoice = {
      amount,
      created_date: createdDate,
      user_id: userId,
      status: 0,
    };
    return pool.query("INSERT INTO credit_invoices SET ?", newInvoice);
  }

  async getInvoicesByUserId(userId) {
    try {
      const [invoices] = await pool.query(
        "SELECT * FROM credit_invoices WHERE user_id = ? ORDER BY created_date DESC",
        [userId]
      );
      // console.log("invoices:",invoices)

      return invoices;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  }
  async getCreditInvoicesById(invoice_id) {
    try {
      const [invoices] = await pool.query(
        "SELECT * FROM credit_invoices WHERE id = ?",
        [invoice_id]
      );
      if (invoices.length === 0) {
        return null;
      }
      return invoices[0];
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  }
}
module.exports = MemberModel;
