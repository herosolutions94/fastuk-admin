// routes/api.js
const express = require('express');
const PromoCodeController = require('../../controllers/admin/promo-code');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const promoCodeController = new PromoCodeController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/add-promo-code-form', promoCodeController.renderAddPromoCodePage.bind(promoCodeController));

router.post('/add-promo-codes', upload, ensureAuthenticated, promoCodeController.addPromoCode.bind(promoCodeController));
router.get('/promo-codes-list', ensureAuthenticated, promoCodeController.getPromoCodes.bind(promoCodeController));
router.get('/promo-codes/edit/:id', ensureAuthenticated, upload, promoCodeController.editPromoCode.bind(promoCodeController)); // Edit form
router.post('/promo-codes/update/:id', ensureAuthenticated, upload, promoCodeController.updatePromoCode.bind(promoCodeController)); // Update rider
// router.delete('/remote-post-codes/delete/:id',checkAccessMiddleware(17), ensureAuthenticated, remotePostCodeController.deleteRemotePostCode.bind(remotePostCodeController));




module.exports = router;
