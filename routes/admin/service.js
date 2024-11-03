// routes/api.js
const express = require('express');
const ServiceController = require('../../controllers/admin/service');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const serviceController = new ServiceController();

router.get('/services/add', serviceController.renderAddServicePage.bind(serviceController));

router.post('/add-services', ensureAuthenticated, upload, serviceController.addService.bind(serviceController));
router.get('/services', ensureAuthenticated, serviceController.getServices.bind(serviceController));
router.get('/services/edit/:id', ensureAuthenticated, upload, serviceController.editService.bind(serviceController)); // Edit form
router.post('/services/update/:id', ensureAuthenticated, upload, serviceController.updateService.bind(serviceController)); // Update rider
router.delete('/services/delete/:id', ensureAuthenticated, serviceController.deleteService.bind(serviceController));




module.exports = router;
