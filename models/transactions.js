// models/RiderModel.js
const pool = require("../config/db-connection");
const BaseModel = require("./baseModel");

class TransactionsModel extends BaseModel {
  constructor() {
    super("transactions"); // Pass the table name to the BaseModel constructor
  }

  static tableName = "transactions";

  static async getTransactionsWithMembers() {
    try {
      const result = await pool.query(`
            SELECT 
    t.id AS id,
    t.transaction_id AS transaction_id,
    t.user_id,
    t.amount,
    t.type,
    t.payment_method,
    t.created_time,
    m.id AS member_id,
    m.full_name AS member_name,
    m.mem_image AS mem_image
FROM transactions t
JOIN members m ON t.user_id = m.id
        WHERE t.is_deleted=0
ORDER BY t.created_time DESC;
;
          `);
      // console.log("Raw Query Result:", result);
      const rows = result[0];
      if (!rows || rows.length === 0) {
        // console.log("No transactions found");
        return [];
      }

      // console.log("Transactions Found:", rows);
      return rows;
    } catch (err) {
      console.error("Error fetching transactions:", err);
      throw err;
    }
  }

  static async getTransactionsById(id) {
    const [transaction] = await pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return transaction; // This should be an object, not an array
  }

  static async deleteTransactionById(id) {
    try {
      const [result] = await pool.query(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0; // Returns true if a row was deleted
    } catch (error) {
      console.error("Database error:", error);
      throw new Error("Failed to delete transaction");
    }
  }
  static async updateData(id, data) {
        // Extract keys and values from the data object
        const keys = Object.keys(data); // ['otp', 'expire_time']
        const values = Object.values(data); // [newOtp, newExpireTime]

        // Construct the SET clause dynamically
        const setClause = keys.map(key => `${key} = ?`).join(', '); // e.g., "otp = ?, expire_time = ?"

        // Build the query dynamically
        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

        // Execute the query, adding the memberId to the values array
        await pool.query(query, [...values, id]);
    }
}

module.exports = TransactionsModel;
