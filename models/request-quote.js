// models/RiderModel.js
const pool = require('../config/db-connection');
const BaseModel = require('./baseModel');

class RequestQuoteModel extends BaseModel {
    constructor() {
        super('request_quote'); // Pass the table name to the BaseModel constructor
    }

    static tableName = 'request_quote';



    // Method to create a new rider with validation
    async createVehicle(data) {

        return this.create(data);  // Call the BaseModel's create method
    }
    async findById(vehicleId) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const [rows] = await pool.query(query, [vehicleId]);
        // console.log(rows)
    return rows.length ? rows[0] : null; // Return the first result or null
    }

    // static async getAllRequestQuotes() {
    //     try {
    //         const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`); // Only take the first result
    //         // console.log('Riders fetched successfully:', rows); // Log the data (only the rows)
    //         return rows; // Return the fetched rows
    //     } catch (error) {
    //         console.error('Error fetching Request Quotes:', error);
    //         throw error;
    //     }
    // }

    static async getRequestQuotesWithMembers(whereConditions) {
    try {
        let query = `
            SELECT 
                rq.*, 
                m.id AS user_id, 
                m.full_name AS member_name, 
                m.mem_image AS member_image,
                m.email AS member_email,
                m.mem_phone AS member_phone,
                r.id AS rider_id,
                r.full_name AS rider_name,
                r.mem_image AS rider_image
            FROM ${this.tableName} rq
            INNER JOIN members m ON rq.user_id = m.id
            LEFT JOIN riders r ON rq.assigned_rider = r.id
        `;

        // If WHERE conditions exist
        if (Array.isArray(whereConditions) && whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(" AND ")} `;
        }

        // FIX: Add space before GROUP BY
        query += ` GROUP BY rq.id`;

        const [rows] = await pool.query(query);
        return rows;

    } catch (error) {
        console.error('Error fetching request quotes with members:', error);
        throw error;
    }
}


    static async getOrderDetailsById(orderId) {
    try {
        const orderQuery = `
            SELECT 
            rq.*, 
            m.id AS user_id, 
            m.full_name AS member_name, 
            m.mem_image AS member_dp, 
            r.id AS rider_id, 
            r.full_name AS rider_name, 
            r.mem_image AS rider_dp
        FROM ${this.tableName} rq
        LEFT JOIN members m ON rq.user_id = m.id
        LEFT JOIN riders r ON rq.assigned_rider = r.id
        WHERE rq.id = ?;
        `;

        const parcelsDistanceQuery = `
            SELECT COALESCE(SUM(distance), 0) AS total_distance 
            FROM request_parcels 
            WHERE request_id = ?;
        `;
        const vehicleQuery = `
            SELECT title 
            FROM vehicles 
            WHERE id = ?;
        `;

        const parcelsQuery = `
            SELECT *
            FROM order_details
            WHERE order_id = ?;
        `;
        const order_stages = `
            SELECT *
            FROM order_stages
            WHERE order_id = ?;
        `;
        const viasQuery = `
            SELECT *
            FROM vias
            WHERE request_id = ?;
        `;

        const invoicesQuery = `
            SELECT request_id, type, amount, amount_type, status, created_date, via_id, payment_type, payment_intent_id, payment_method_id, payment_method
            FROM invoices
            WHERE request_id = ?;
        `;

        // Execute queries
        const [orderRows] = await pool.query(orderQuery, [orderId]);
        const [parcelsRows] = await pool.query(parcelsQuery, [orderId]);
        const [order_stages_arr] = await pool.query(order_stages, [orderId]);
        const [viasRows] = await pool.query(viasQuery, [orderId]);
        const [parcelsDistanceQueryRows] = await pool.query(parcelsDistanceQuery, [orderId]);
        let vehicle_name="";
        if(orderRows?.length > 0){
            const selected_vehicle=orderRows[0]?.selected_vehicle
            let [vehicleQueryRows] = await pool.query(vehicleQuery, [selected_vehicle]);
            vehicle_name=vehicleQueryRows?.length > 0 ? vehicleQueryRows[0]?.title : ''
        }
        
        const [invoicesRows] = await pool.query(invoicesQuery, [orderId]);

        if (!orderRows.length) return null; // No order found

        return { 
            ...orderRows[0], // Order details
            parcels: parcelsRows, // Array of parcels
            invoices: invoicesRows,
            vias:viasRows,
            total_distance: parcelsDistanceQueryRows?.length > 0 ? parcelsDistanceQueryRows[0]?.total_distance : 0,
            vehicle_name:vehicle_name,
            order_stages_arr
        };
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
}

    
    
    
    
    
    static async getRequestQuoteById(id) {
        // console.log("id",id)
        const [requestQuote] = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        // console.log("requestQuote",requestQuote)
        return requestQuote; // This should be an object, not an array
    }

    static async deleteRequestQuoteById(id) {
        try {
            const [result] = await pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            return result.affectedRows > 0; // Returns true if a row was deleted
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to delete Request Quote');
        }
    }

    static async totalPaidAmount(id) {
        try {
            // Query to sum amount for 'charges' payment type and a specific request_id
            const [result] = await pool.query(
                `SELECT SUM(amount) AS totalAmount FROM invoices WHERE payment_type='payment' AND request_id=? AND status=1`, 
                [id]
            );
            // console.log("query result",result)
    
            // If no rows are found, return 0, otherwise return the totalAmount
            const totalAmount = result[0]?.totalAmount !== null ? result[0]?.totalAmount : 0;
            // console.log(totalAmount)
    
            return totalAmount;
        } catch (error) {
            console.error('Database error:', error);
            throw new Error('Failed to calculate total paid amount');
        }
    }
    

    // Assuming you're using a pool for database queries
static async calculateDueAmount(id) {
    try {
        // Query to sum amount for 'charges' payment type
        const [chargesResult] = await pool.query(
            `SELECT SUM(amount) AS totalCharges FROM invoices WHERE payment_type='charges' AND request_id=?`, 
            [id]
        );

        // Query to sum amount for 'payment' payment type
        const [paymentsResult] = await pool.query(
            `SELECT SUM(amount) AS totalPayments FROM invoices WHERE payment_type='payment' AND request_id=? AND status=1`, 
            [id]
        );

        // Calculate the due amount (charges - payments)
        const totalCharges = chargesResult[0]?.totalCharges || 0;
        const totalPayments = paymentsResult[0]?.totalPayments || 0;

        const dueAmount = totalCharges - totalPayments;
        // console.log("dueAmount:",dueAmount)

        return dueAmount;  // Return the calculated due amount
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Failed to calculate due amount');
    }
}

static async updateRequestStatus(id, status) {
    // console.log(id,status);return;
    const query = `UPDATE request_quote SET status = ?, request_status = ? WHERE id = ?`;
    const values = [status,status, id];
    try {
        const [result] = await pool.query(query, values);
        
        if (result.affectedRows === 0) {
            return null; // No rows updated, possibly because the ID doesn't exist
        }
        return true; // Return the updated status and ID    } catch (error) {
        } catch (error) {
            throw new Error('Error updating request quote status: ' + error.message);
        }
}



static async getRequestQuoteDetailsById(id) {
  try {
    // 1. Fetch the main request_quote row
    const quoteQuery = `SELECT * FROM request_quote WHERE id = ? LIMIT 1`;
    const [quoteRows] = await pool.query(quoteQuery, [id]);

    if (quoteRows.length === 0) {
      return null;
    }

    const quote = quoteRows[0];

    // 2. Fetch related vias
    const viasQuery = `SELECT * FROM vias WHERE request_id = ? ORDER BY id ASC`;
    const [vias] = await pool.query(viasQuery, [id]);

    // 3. Fetch related parcels
    const parcelsQuery = `SELECT * FROM request_parcels WHERE request_id = ? ORDER BY id ASC`;
    const [parcels] = await pool.query(parcelsQuery, [id]);

    const order_stages = `SELECT * FROM order_stages WHERE order_id = ? ORDER BY id ASC`;
    const [order_stages_arr] = await pool.query(order_stages, [id]);

    // 4. Combine everything
    return {
      ...quote,
      vias,
      parcels,
      order_stages_arr
    };
  } catch (err) {
    console.error("getRequestQuoteDetailsById error:", err);
    throw err;
  }
}



    
}

module.exports = RequestQuoteModel;
