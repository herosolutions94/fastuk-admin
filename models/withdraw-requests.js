const pool = require('../config/db-connection'); // Ensure this is promise-based
const helpers = require('../utils/helpers');

class WithdrawalRequests {
    static async getAllWithdrawalRequests() {
        try {
          const query = `
            SELECT 
                wr.id AS withdrawal_id,
                wr.user_id AS rider_id,
                r.full_name AS rider_name,
                r.mem_image AS rider_dp,
                wr.account_details,
                wr.paypal_details,
                wr.amount,
                wr.status,
                wr.created_at,
                wr.updated_at
            FROM 
                withdraw_requests AS wr
            JOIN 
                riders AS r
            ON 
                wr.user_id = r.id;
          `;
      
          const [results] = await pool.query(query);
          return results; // Return all withdrawal requests with rider details
        } catch (error) {
          console.error("Error fetching withdrawal requests:", error);
          return null;
        }
      }

      static async getWithdrawalRequestById(id) {
        try {
          const query = `
            SELECT 
                wr.id AS withdrawal_id,
                wr.user_id AS rider_id,
                r.full_name AS rider_name,
                r.mem_image AS rider_dp,
                wr.account_details,
                wr.paypal_details,
                wr.amount,
                wr.status,
                wr.created_at,
                wr.updated_at
            FROM 
                withdraw_requests AS wr
            JOIN 
                riders AS r
            ON 
                wr.user_id = r.id
            WHERE 
                wr.id = ?;
          `;
      
          const [withdrawalRequest] = await pool.query(query, [id]);
      
          if (withdrawalRequest.length > 0) {
            return withdrawalRequest[0]; // Return the first record
          } else {
            return null; // No withdrawal request found
          }
        } catch (error) {
          console.error("Error fetching withdrawal request:", error);
          throw error;
        }
      }

      static async deleteWithdrawalRequestById(id) {
        try {
            const query = `DELETE FROM withdraw_requests WHERE id = ?`;
            const [result] = await pool.query(query, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted

        } catch (error) {
            console.error('Error deleting withdrawal request:', error);
            throw error;
        }
    }
    // static async approveWithdrawalRequest(requestId) {
    //   try {
    //     // Assuming `db` is your MySQL connection instance
    //     const query = 'UPDATE withdrawal_requests SET status = ? WHERE id = ?';
  
    //     // Execute the query
    //     const [result] = await db.execute(query, ['cleared', requestId]);
  
    //     // Check if the update was successful
    //     if (result.affectedRows > 0) {
    //       return { success: true, message: 'Withdrawal request approved successfully' };
    //     } else {
    //       throw new Error('No rows were updated, request may not exist');
    //     }
    //   } catch (error) {
    //     console.error('Error updating withdrawal request status:', error);
    //     throw new Error('Failed to approve withdrawal request');
    //   }
    // }

    static async updateWithdrawalStatus(requestId) {
      const query = `
        UPDATE withdraw_requests 
        SET status = ?, updated_at = ? 
        WHERE id = ?
      `;
      const updated_at = helpers.getUtcTimeInSeconds(new Date())
      const values = ['cleared', updated_at, requestId];
    
      try {
        const [result] = await pool.query(query, values); // Use `execute` for parameterized queries
        return result.affectedRows > 0; // Check if any rows were updated
      } catch (error) {
        console.error('Error updating withdrawal status:', error);
        throw error;
      }
    }
    

    static async deleteMessageById(id) {
      try {
          const [result] = await pool.query('DELETE FROM messages WHERE id = ?', [id]);
          return result.affectedRows > 0; // Returns true if a row was deleted
      } catch (error) {
          console.error('Database error:', error);
          throw new Error('Failed to delete message');
      }
  }
    

      
      



}
module.exports = WithdrawalRequests;
