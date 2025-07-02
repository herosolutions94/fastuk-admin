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
            payment_method, payment_method_id, status, start_date, created_date, notes, rider_price, promo_code, discount, 
            pickup_time_option, pickup_start_time, pickup_start_date, pickup_end_date, pickup_end_time, delivery_time_option, delivery_start_date, delivery_start_time, delivery_end_date, delivery_end_time, pickup_time, pickup_date, delivery_time, delivery_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?,?)
        `;
        const values = [
  data.user_id ?? null,
  data.selected_vehicle ?? null,
  data.vehicle_price ?? 0,
  data.total_amount ?? 0,
  data.tax ?? 0,
  data.payment_intent || null,
  data.customer_id || null,
  data.source_postcode || '',
  data.source_address || '',
  data.source_name || '',
  data.source_phone_number || '',
  data.source_city || '',
  data.dest_postcode || '',
  data.dest_address || '',
  data.dest_name || '',
  data.dest_phone_number || '',
  data.dest_city || '',
  data.payment_method || '',
  data.payment_method_id || '',
  data.status || 'paid',
  data.start_date || null,
  data.created_date || new Date(), // fallback
  data.notes || '',
  data.rider_price ?? 0,
  data.promo_code || '',
  data.discount ?? 0,

  // new fields - validate properly
  data.pickup_time_option || null,
  data.pickup_start_time || null,
  data.pickup_start_date || null,
  data.pickup_end_date || null,
  data.pickup_end_time || null,

  data.delivery_time_option || null,
  data.delivery_start_date || null,
  data.delivery_start_time || null,
  data.delivery_end_date || null,
  data.delivery_end_time || null,

  data.pickup_time || null,
  data.pickup_date || null,
  data.delivery_time || null,
  data.delivery_date || null
];

        // console.log("values:",values)
        // console.log("createRequestQuote values:", values,data);return;

    
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
            parcel_type,postcode)
            VALUES(?,?,?,?,?,?,?,?,?,?,?, ?)
            
        `;
        for (const parcel of parcels) {
            const values = [parcel.request_id, parcel.length, parcel.width, parcel.height, parcel.weight, parcel.quantity, parcel.destination, parcel.source, parcel.parcelNumber, parcel.distance, parcel.parcelType,parcel.postcode];
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
            city,
            via_pickup_time_option,
            via_pickup_time,
            via_pickup_date,
            via_pickup_start_date,
            via_pickup_start_time,
            via_pickup_end_date,
            via_pickup_end_time
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?, ?)
            
        `;
        for (const via of vias) {
            const values = [via.request_id, via.full_name, via.phone_number, via.post_code, via.address, via.city, via.via_pickup_time_option, via.via_pickup_time || null, via.via_pickup_date || null, via.via_pickup_start_date || null, via.via_pickup_end_date || null, via.via_pickup_start_time || null, via.via_pickup_end_time || null];
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


// async getOrdersByStatus(status) {
//     let query = 'SELECT * FROM request_quote';
//     let values = [];

//     if (status === 'completed') {
//       query += ' WHERE status = ?';
//       values.push('completed');
//     } else if (status) {
//       query += ' WHERE status != ?';
//       values.push('completed');
//     }

//     const [rows] = await pool.query(query, values);
//     return rows;
//   }        
      
    
    


}

module.exports = PageModel;
