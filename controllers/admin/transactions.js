// controllers/api/RiderController.js
const fs = require('fs'); // Import the file system module
const path = require('path'); // For handling file paths

const BaseController = require('../baseController');
const Transactions = require('../../models/transactions');
const Member = require("../../models/memberModel");

const { validateRequiredFields } = require('../../utils/validators');
const helpers = require("../../utils/helpers");

class TransactionsController extends BaseController {
    constructor() {
        super();
        this.transactions = new Transactions();
        this.member = new Member();
    }

    
    async getTransactions(req, res) {
        try {
          const transactionsWithMembers = await Transactions.getTransactionsWithMembers();
      
          if (transactionsWithMembers && transactionsWithMembers.length > 0) {
            // console.log('transactionsWithMembers:', transactionsWithMembers); // Ensure data is logged here
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

      async getRiderTransactions(req, res) {
    try {
        const transactionId = req.params.id;

        const data = await Transactions.getTransactionDetails(transactionId);

        if (!data || data.length === 0) {
            return res.render("admin/transaction-details", { transactions: null });
        }
                    console.log('data:', data); // Ensure data is logged here


        return res.render("admin/transaction-details", {
            transactions: data[0]   // return single row
        });

    } catch (error) {
        console.error("Error fetching transaction details:", error);
        return res.render("admin/transaction-details", { transactions: null });
    }
}



    
}



module.exports = TransactionsController;
