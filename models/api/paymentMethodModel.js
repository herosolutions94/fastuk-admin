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
}

module.exports = PaymentMethodModel;
