const pool  = require("../config/db-connection");

// Define the getAdminData middleware
const siteInfoMiddleware = async(req, res, next) => {

    try{

        const [rows] = await pool.query('SELECT * FROM tbl_admin LIMIT 1')

        if (rows.length > 0){
            const adminData = rows[0];

            res.locals.adminData = adminData;
        }else{
            res.locals.adminData = {
                site_name: 'Default Site Name',
                site_email: 'default@example.com'
            }
        }
        next();

    }catch(error) {
        console.error('Error fetching site info:', error);
        next(error);
    }

};

  module.exports = siteInfoMiddleware;
  