// routes/api.js
const express = require('express');
const VehicleController = require('../../controllers/admin/vehicle');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const vehicleController = new VehicleController();

router.get('/add-vehicle-form', vehicleController.renderAddVehiclePage.bind(vehicleController));

router.post('/add-vehicles', ensureAuthenticated, upload, vehicleController.addVehicle.bind(vehicleController));
router.get('/vehicles-list', ensureAuthenticated, vehicleController.getVehicles.bind(vehicleController));
router.get('/vehicles/edit/:id', ensureAuthenticated, upload, vehicleController.editVehicle.bind(vehicleController)); // Edit form
router.post('/vehicles/update/:id', ensureAuthenticated, upload, vehicleController.updateVehicle.bind(vehicleController)); // Update rider
router.delete('/vehicles/delete/:id', ensureAuthenticated, vehicleController.deleteVehicle.bind(vehicleController));




module.exports = router;
