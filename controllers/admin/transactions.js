// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Transactions = require('../../models/transactions');
const { validateRequiredFields } = require('../../utils/validators');


class TransactionsController extends BaseController {
    constructor() {
        super();
        this.transactions = new Transactions();
    }

    
    async getTransactions(req, res) {
        try {
          const transactionsWithMembers = await Transactions.getTransactionsWithMembers();
      
          if (transactionsWithMembers && transactionsWithMembers.length > 0) {
            // console.log('reviews:', reviewsWithMembers); // Ensure data is logged here
            res.render('admin/transactions', { transactions: transactionsWithMembers });
          } else {
            // console.log('No reviews found'); // Debugging fallback
            res.render('admin/transactions', { transactions: [] }); // Render empty array if no data
          }
        } catch (error) {
          console.error('Error fetching Transactions with members:', error);
          res.render('admin/transactions', { transactions: [] }); // Render empty array on error
        }
      }

    
    async deleteTransaction(req, res) {
        const transactionId = req.params.id;
        try {
            // Step 1: Fetch the rider details to get the associated image filename
            const currentTransaction = (await Transactions.getTransactionsById(transactionId))[0]; // Fetch current rider details
            if (!currentTransaction) {
                return this.sendError(res, 'Transaction not found');
            }

            // Step 3: Delete the rider from the database
            const result = await Transactions.deleteTransactionById(transactionId);
            if (result) {
                // Redirect to the riders list after deletion
                res.json({
                    status: 1,
                    message: 'Transaction deleted successfully!',
                    redirect_url: '/admin/transactions-list'
                });            
            } else {
                this.sendError(res, 'Failed to delete Transaction');
            }
        } catch (error) {
            return res.status(200).json({ // Changed to status 500 for server errors
                status: 0,
                message: 'An error occurred while deleting Transaction.',
                error: error.message
            });
        }
    }
    
}



module.exports = TransactionsController;
