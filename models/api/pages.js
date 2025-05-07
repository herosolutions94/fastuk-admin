const pool = require('../../config/db-connection');
const BaseModel = require('../baseModel');

class PageModel extends BaseModel {
    constructor() {
        super('pages'); // Pass the table name
    }

    async findByKey(key) {
        const [rows] = await pool.query(`SELECT * FROM ?? WHERE \`key\` = ?`, [this.tableName, key]);
        return rows.length ? rows[0] : null;
    }



    async createRequestQuote(data) {
        const query = `
            INSERT INTO request_quote(user_id, selected_vehicle, vehicle_price, total_amount,tax, payment_intent, customer_id, source_postcode, source_address,
            source_name, source_phone_number, source_city, dest_postcode, dest_address, dest_name, dest_phone_number, dest_city,
            payment_method, payment_method_id, status, start_date, created_date, notes, rider_price, promo_code, discount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.user_id,
            data.selected_vehicle,
            data.vehicle_price,
            data.total_amount,
            data.tax,
            data.payment_intent,
            data.customer_id,
            data.source_postcode,
            data.source_address,
            data.source_name,
            data.source_phone_number,
            data.source_city,
            data.dest_postcode,
            data.dest_address,
            data.dest_name,
            data.dest_phone_number,
            data.dest_city,
            data.payment_method,
            data.payment_method_id,
            data?.status ? data?.status : 'paid',
            data.start_date,
            data.created_date,
            data.notes,
            data.rider_price,
            data.promo_code,
            data.discount,

        ];
        // console.log("values:",values)
    
        const result = await pool.query(query, values);
        // console.log("result:",result)
        const insertId = result[0].insertId;
    
        // Generate unique booking_id
        const bookingId = `RQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${insertId}`;
        const tracking_id = `FU-${Date.now()}-${insertId}`;
    
        // Update the booking_id in the database
        const updateQuery = `UPDATE request_quote SET booking_id = ?, tracking_id = ? WHERE id = ?`;
        await pool.query(updateQuery, [bookingId, tracking_id, insertId])
        // console.log(updateQuery)
    
        return insertId;
    }
    

    async insertParcels(parcels) {
        const query = `
            INSERT INTO request_parcels(request_id,
            length ,
            width,
            height,
            weight,
            quantity,
            destination,
            source,
            parcel_number,
            distance,
            parcel_type)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)
            
        `;
        for (const parcel of parcels) {
            const values = [parcel.request_id, parcel.length, parcel.width, parcel.height, parcel.weight, parcel.quantity, parcel.destination, parcel.source, parcel.parcelNumber, parcel.distance, parcel.parcelType];
            // console.log('Inserting values:', values);

            const [result] = await pool.query(query, values);
            // console.log('Insert result:', result);
        }
    }

    async insertVias(vias) {
        const query = `
            INSERT INTO vias(request_id,
            full_name ,
            phone_number,
            post_code,
            address,
            city)
            VALUES(?,?,?,?,?,?)
            
        `;
        for (const via of vias) {
            const values = [via.request_id, via.full_name, via.phone_number, via.post_code, via.address, via.city];
            // console.log('Inserting values:', values);

            const [result] = await pool.query(query, values);
            // console.log('Insert result:', result);
        }
    }

    async insertOrderDetails(detailsArray) {
        const query = `
            INSERT INTO order_details 
            (order_id, source_address, destination_address, distance, height, length, width, weight, quantity, parcel_number, parcel_type, price,source_lat,source_lng,destination_lat,destination_lng) 
            VALUES ?
        `;
    
        // Prepare data for bulk insert
    const values = detailsArray.map((detail) => [
        detail.order_id,
        detail.source_address,
        detail.destination_address,
        detail.distance,
        detail.height,
        detail.length,
        detail.width,
        detail.weight,
        detail.quantity,
        detail.parcel_number,
        detail.parcel_type,
        detail.price,
        detail.source_lat,
        detail.source_lng,
        detail.destination_lat,
        detail.destination_lng,
    ]);
    const [result] = await pool.query(query, [values]);
    // console.log('Insert result:', result);


    }

    async insertInCredits(credit) {
        const query = `
            INSERT INTO credits (user_id, type, credits, created_date, e_type)
            VALUES (?, ?, ?, ?, ?)
        `;
    
        const values = [
            credit.user_id,
            credit.type,
            credit.credits,
            credit.created_date,
            credit.e_type
        ];
    
        const [result] = await pool.query(query, values);
        return result; // Returning result for debugging
    }

    async findAllCities(query) {
        const sql = `SELECT name FROM cities WHERE name LIKE ? LIMIT 10`; // Use MySQL wildcard query
        const values = [`%${query}%`]; // Pass query value
    
        try {
          const [result] = await pool.execute(sql, values); // Use .execute() for MySQL
          return result; // Returning result array
        } catch (error) {
          console.error("Database Error:", error);
          throw error;
        }
      }

       
      async insertLicense ({ request_id, file_name, type, via_id, created_time }) {
          const query = `
            INSERT INTO request_quote_attachments (request_id, file_name, type, via_id, created_time)
            VALUES (?, ?, ?, ?, ?)
            `;
          const values = [request_id, file_name, type, via_id, created_time];
      
          const result = await pool.query(query, values);
          return result;
        }
      
    
    


}

module.exports = PageModel;
