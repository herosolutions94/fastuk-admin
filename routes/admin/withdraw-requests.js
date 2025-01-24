const express = require('express');
const router = express.Router();
const WithdrawaRequestController = require('../../controllers/admin/withdraw-requests');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');




router.get('/withdraw-requests-list', ensureAuthenticated, WithdrawaRequestController.getWithdrawalRequests.bind(WithdrawaRequestController));
router.get('/withdraw-request-detail/:id', ensureAuthenticated, WithdrawaRequestController.WithdrawalRequestDetail.bind(WithdrawaRequestController)); // Edit form
router.delete('/withdraw-request-delete/:id', ensureAuthenticated, WithdrawaRequestController.deleteWithdrawalRequest.bind(WithdrawaRequestController));
router.get('/approve-withdrawal/:id', ensureAuthenticated, WithdrawaRequestController.approveWithdrawalRequest.bind(WithdrawaRequestController));



module.exports = router;
