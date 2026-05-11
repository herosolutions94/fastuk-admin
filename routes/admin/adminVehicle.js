// routes/api.js
const express = require('express');
const AdminVehicleController = require('../../controllers/admin/adminVehicle');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const adminVehicleController = new AdminVehicleController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/add-admin-vehicle-form', checkAccessMiddleware(15), adminVehicleController.renderAdminAddVehiclePage.bind(adminVehicleController));
router.post('/add-admin-vehicles', checkAccessMiddleware(15), upload, adminVehicleController.addAdminVehicle.bind(adminVehicleController));
router.get('/admin-vehicles-list', ensureAuthenticated,checkAccessMiddleware(15), adminVehicleController.getAdminVehicles.bind(adminVehicleController));
router.get('/admin-vehicles/edit/:id', ensureAuthenticated,checkAccessMiddleware(15), upload, adminVehicleController.editAdminVehicle.bind(adminVehicleController)); // Edit form
router.post('/admin-vehicles/update/:id', ensureAuthenticated,checkAccessMiddleware(15), upload, adminVehicleController.updateAdminVehicle.bind(adminVehicleController)); // Update rider
router.delete('/admin-vehicles/delete/:id', ensureAuthenticated,checkAccessMiddleware(15), adminVehicleController.deleteAdminVehicle.bind(adminVehicleController));









module.exports = router;
