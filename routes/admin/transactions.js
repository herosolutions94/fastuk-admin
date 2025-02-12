// routes/api.js
const express = require('express');
const TransactionsController = require('../../controllers/admin/transactions');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const transactionsController = new TransactionsController();


router.get('/transactions-list', ensureAuthenticated, transactionsController.getTransactions.bind(transactionsController));
router.delete('/transactions/delete/:id', ensureAuthenticated, transactionsController.deleteTransaction.bind(transactionsController));




module.exports = router;
