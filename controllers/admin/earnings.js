// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const RiderModel = require('../../models/riderModel');
const { validateRequiredFields } = require('../../utils/validators');


class EarningsController extends BaseController {
    constructor() {
        super();
        this.rider = new RiderModel();
    }

    
    async getEarnings(req, res) {
        try {
          const earnings = await this.rider.getAllEarnings();
      
          res.render('admin/earnings', { earnings: earnings });
        } catch (error) {
          console.error('Error fetching Transactions with members:', error);
          res.render('admin/transactions', { transactions: [] }); // Render empty array on error
        }
      }

    
    
}



module.exports = EarningsController;
