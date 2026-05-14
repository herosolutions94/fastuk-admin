// routes/api.js
const express = require('express');
const payoutsController = require('../../controllers/admin/payoutsController');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');

const router = express.Router();
// const payoutsController = new PayoutsController();




router.get('/pending-payout', ensureAuthenticated, checkAccessMiddleware(5), payoutsController.getRiders.bind(payoutsController));
router.get('/pending-earnings/:rider_id', ensureAuthenticated, checkAccessMiddleware(5), payoutsController.getRiderPendingEarnings.bind(payoutsController));
router.post(
  '/payout/pay',
  ensureAuthenticated,
  checkAccessMiddleware(5),
  upload,
  payoutsController.payRiderPendingEarnings.bind(payoutsController)
);
router.get(
  '/pay-rider-payout/:rider_id',
  ensureAuthenticated,
  checkAccessMiddleware(5),
  payoutsController.renderPayRiderPayoutPage.bind(payoutsController)
);
router.get(
  '/paid-earnings/:rider_id',
  ensureAuthenticated,
  checkAccessMiddleware(5),
  payoutsController.getPaidRiderEarnings.bind(payoutsController)
);



module.exports = router;
