const express = require('express');
const router = express.Router();
const WithdrawaRequestController = require('../../controllers/admin/withdraw-requests');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');





router.get('/withdraw-requests-list', ensureAuthenticated, checkAccessMiddleware(8), WithdrawaRequestController.getWithdrawalRequests.bind(WithdrawaRequestController));
router.get('/withdraw-request-detail/:id', ensureAuthenticated, checkAccessMiddleware(8), WithdrawaRequestController.WithdrawalRequestDetail.bind(WithdrawaRequestController)); // Edit form
router.delete('/withdraw-request-delete/:id', ensureAuthenticated, checkAccessMiddleware(8), WithdrawaRequestController.deleteWithdrawalRequest.bind(WithdrawaRequestController));
router.get('/approve-withdrawal/:id', ensureAuthenticated, checkAccessMiddleware(8), WithdrawaRequestController.approveWithdrawalRequest.bind(WithdrawaRequestController));



module.exports = router;
