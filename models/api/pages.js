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
            INSERT INTO request_quote(user_id, selected_vehicle, vehicle_price, total_amount, payment_intent, customer_id, source_postcode,source_address,
        source_name,
        source_phone_number,
        source_city,
        dest_postcode,
        dest_address,
        dest_name,
        dest_phone_number,
        dest_city,
        payment_method,
        payment_method_id, status)
            VALUES(?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?)
            
        `;
        const values = [
            data.user_id,
            data.selected_vehicle,
            data.vehicle_price,
            data.total_amount,
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
            'paid'
        ];
        const result = await pool.query(query, values);
        const insertId = result[0].insertId; // Access insertId from the first element
        console.log(insertId);
        return insertId;

    }

    async insertParcels(parcels) {
        const query = `
            INSERT INTO request_parcels(request_id,
            length ,
            width,
            height,
            weight,
            destination,
            source,
            parcel_number,
            distance,
            parcel_type)
            VALUES(?,?,?,?,?,?,?,?,?,?)
            
        `;
        for (const parcel of parcels) {
            const values = [parcel.request_id, parcel.length, parcel.width, parcel.height, parcel.weight, parcel.destination, parcel.source, parcel.parcelNumber, parcel.distance, parcel.parcelType];
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
            console.log('Inserting values:', values);

            const [result] = await pool.query(query, values);
            console.log('Insert result:', result);
        }
    }


}

module.exports = PageModel;
