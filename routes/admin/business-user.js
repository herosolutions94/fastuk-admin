const express = require('express');
const router = express.Router();
const BusinessUserController = require('../../controllers/admin/business-user');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');


// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/business-users', ensureAuthenticated, BusinessUserController.getBusinessUsers.bind(BusinessUserController));
router.get('/business-users/edit/:id', ensureAuthenticated, upload, BusinessUserController.editBusinessUser.bind(BusinessUserController)); // Edit form
router.post('/business-users/update/:id', ensureAuthenticated, upload, BusinessUserController.updateBusinessUser.bind(BusinessUserController)); // Update rider
router.delete('/business-users/delete/:id', ensureAuthenticated, BusinessUserController.deleteBusinessUser.bind(BusinessUserController));
router.get('/business-users/update-status/:id',ensureAuthenticated, upload, BusinessUserController.handleBusinessUserApprove.bind(BusinessUserController));








module.exports = router;
