// models/RiderModel.js
const pool = require('../../config/db-connection');
const BaseModel = require('../baseModel');

class PaymentMethodModel extends BaseModel {
    constructor() {
        super('payment_methods');
    }

    // Get all payment methods for a user by user_id and user_type
    async getPaymentMethodsByUserId(userId, userType) {
        const query = `SELECT * FROM payment_methods WHERE user_id = ? AND user_type = ?`;
        const [rows] = await pool.query(query, [userId, userType]);  // The query now works with promises

        return rows;
    }
    async getPaymentMethodById(id) {
        // Your database query here
        const query = 'SELECT * FROM payment_methods WHERE id = ?';
        console.log(query,"query")
        const [rows] = await pool.query(query, [id]);
        console.log(rows,"rows")
        return rows?.length > 0 ? rows[0] : null;
    }

    async getPaymentMethodsByIdAndUserId(id, userId) {
        const query = `SELECT * FROM payment_methods WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.query(query, [id, userId]);  // The query now works with promises

        return rows;
    }

    // Add new payment method to the database
    async addPaymentMethod(paymentMethodData) {
        const { user_id, user_type, payment_method_id, card_number, exp_month, exp_year, brand, is_default } = paymentMethodData;
        const query = `
            INSERT INTO payment_methods (user_id, user_type, payment_method_id, card_number, exp_month, exp_year, brand, is_default, created_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) `;
        const values = [user_id, user_type, payment_method_id, card_number, exp_month, exp_year, brand, is_default];
        const [rows] = await pool.query(query, values);  // The query now works with promises
        return rows[0];  // Return the newly inserted payment method
    }

    async getDefaultPaymentMethodByUserId(userId) {
        try {
          const query = 'SELECT * FROM payment_methods WHERE user_id = ? AND is_default = 1';
          const [rows] = await pool.query(query, [userId]);
          return rows || [];  // Ensure it returns an array
        } catch (error) {
          console.error('Error fetching default payment method:', error.message);
          throw new Error('Database error');
        }
      }

      // Set all payment methods' is_default to 0 for a specific user
    async setAllPaymentMethodsAsNotDefault(userId) {
        const query = `UPDATE payment_methods SET is_default = 0 WHERE user_id = ?`;
        await pool.query(query, [userId]);
    }
    // Set a specific payment method's is_default to 1
    async setPaymentMethodAsDefault(paymentMethodId) {
        const query = `UPDATE payment_methods SET is_default = 1 WHERE id = ?`;
        await pool.query(query, [paymentMethodId]);
    }

    // Delete payment method by ID
    async deletePaymentMethodById(id) {
        const query = `DELETE FROM payment_methods WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result;
    }
}

module.exports = PaymentMethodModel;
