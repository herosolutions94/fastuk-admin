// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const RiderModel = require('../../models/riderModel');
const { validateRequiredFields } = require('../../utils/validators');
const helpers = require("../../utils/helpers");


class EarningsController extends BaseController {
    constructor() {
        super();
        this.rider = new RiderModel();
    }

    
    async getEarnings(req, res) {
        try {
          const earnings = await this.rider.getAllEarnings();
          console.log("earnings:",earnings)
      
          res.render('admin/earnings', { earnings: earnings });
        } catch (error) {
          console.error('Error fetching Transactions with members:', error);
          res.render('admin/transactions', { transactions: [] }); // Render empty array on error
        }
      }
      async deleteEarning(req, res) {
        const earningId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentTransaction = (await this.rider.getEarningById(earningId))[0]; // Fetch current rider details
            if (!currentTransaction) {
                return this.sendError(res, 'Transaction not found');
            }

            // Step 3: Delete the rider from the database
            const result = await this.rider.updateEarningData(earningId,{
                is_deleted:1,
                deleted_at:helpers.getUtcTimeInSeconds()
            });
            // if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Earning deleted successfully!',
                    redirect_url: '/admin/earnings'
                });            
            // } else {
            //     this.sendError(res, 'Failed to delete Transaction');
            // }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting earning.',
                error: error.message
            });
        }
    }

    
    
}



module.exports = EarningsController;
