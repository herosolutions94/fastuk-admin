// routes/api.js
const express = require('express');
const VehicleController = require('../../controllers/admin/vehicle');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const vehicleController = new VehicleController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/add-vehicle-form', checkAccessMiddleware(15), vehicleController.renderAddVehiclePage.bind(vehicleController));

router.post('/add-vehicles', ensureAuthenticated,checkAccessMiddleware(15), upload, vehicleController.addVehicle.bind(vehicleController));
router.get('/vehicles-list', ensureAuthenticated,checkAccessMiddleware(15), vehicleController.getVehicles.bind(vehicleController));
router.get('/vehicles/edit/:id', ensureAuthenticated,checkAccessMiddleware(15), upload, vehicleController.editVehicle.bind(vehicleController)); // Edit form
router.post('/vehicles/update/:id', ensureAuthenticated,checkAccessMiddleware(15), upload, vehicleController.updateVehicle.bind(vehicleController)); // Update rider
router.delete('/vehicles/delete/:id', ensureAuthenticated,checkAccessMiddleware(15), vehicleController.deleteVehicle.bind(vehicleController));




module.exports = router;
