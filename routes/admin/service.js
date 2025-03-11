// routes/api.js
const express = require('express');
const ServiceController = require('../../controllers/admin/service');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const serviceController = new ServiceController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/services/add', checkAccessMiddleware(14), serviceController.renderAddServicePage.bind(serviceController));

router.post('/add-services', ensureAuthenticated,checkAccessMiddleware(14), upload, serviceController.addService.bind(serviceController));
router.get('/services', ensureAuthenticated, checkAccessMiddleware(14), serviceController.getServices.bind(serviceController));
router.get('/services/edit/:id', ensureAuthenticated, checkAccessMiddleware(14), upload, serviceController.editService.bind(serviceController)); // Edit form
router.post('/services/update/:id', ensureAuthenticated,checkAccessMiddleware(14), upload, serviceController.updateService.bind(serviceController)); // Update rider
router.delete('/services/delete/:id', ensureAuthenticated,checkAccessMiddleware(14), serviceController.deleteService.bind(serviceController));




module.exports = router;
