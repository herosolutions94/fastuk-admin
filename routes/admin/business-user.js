const express = require('express');
const router = express.Router();
const BusinessUserController = require('../../controllers/admin/business-user');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');



// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/business-users', ensureAuthenticated,checkAccessMiddleware(4), BusinessUserController.getBusinessUsers.bind(BusinessUserController));
router.get('/business-users/edit/:id', ensureAuthenticated,checkAccessMiddleware(4), upload, BusinessUserController.editBusinessUser.bind(BusinessUserController)); // Edit form
router.post('/business-users/update/:id', ensureAuthenticated,checkAccessMiddleware(4), upload, BusinessUserController.updateBusinessUser.bind(BusinessUserController)); // Update rider
router.delete('/business-users/delete/:id', ensureAuthenticated,checkAccessMiddleware(4), BusinessUserController.deleteBusinessUser.bind(BusinessUserController));
router.get('/business-users/update-status/:id',ensureAuthenticated,checkAccessMiddleware(4), upload, BusinessUserController.handleBusinessUserApprove.bind(BusinessUserController));








module.exports = router;
