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
        const transactions = data[0]

        const subtotal = helpers?.format_amount(
      (parseFloat(transactions?.total_amount || 0) -
        parseFloat(transactions?.tax || 0) -
        parseFloat(transactions?.vat || 0))
    );

        // parcel list → all rows
const parcels = data.map(r => ({
    parcel_type: r.parcel_type,
    length: r.length,
    width: r.width,
    height: r.height,
    weight: r.weight,
    quantity: r.quantity
})).filter(p => p.parcel_type); // remove null rows


        return res.render("admin/transaction-details", {
            transactions,   // return single row
            parcels,
            subtotal
        });

    } catch (error) {
        console.error("Error fetching transaction details:", error);
        return res.render("admin/transaction-details", { transactions: null });
    }
}



    
}



module.exports = TransactionsController;
