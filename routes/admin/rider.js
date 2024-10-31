const express = require('express');
const router = express.Router();
const RiderController = require('../../controllers/admin/rider');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');


// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/riders-list', ensureAuthenticated, RiderController.getRiders.bind(RiderController));
router.get('/riders/edit/:id', ensureAuthenticated, upload, RiderController.editRider.bind(RiderController)); // Edit form
router.post('/riders/update/:id', ensureAuthenticated, upload, RiderController.updateRider.bind(RiderController)); // Update rider
router.delete('/riders/delete/:id', ensureAuthenticated, RiderController.deleteRider.bind(RiderController));


module.exports = router;
