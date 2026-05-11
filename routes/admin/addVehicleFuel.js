// routes/api.js
const express = require('express');
const VehicleFuelController = require('../../controllers/admin/addVehicleFeul');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const vehicleFuelController = new VehicleFuelController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/add-vehicle-fuel-form/:rider_id', checkAccessMiddleware(15), vehicleFuelController.renderAddFuelPage.bind(vehicleFuelController));
router.post('/add-vehicle-fuel/:rider_id', checkAccessMiddleware(15), upload, vehicleFuelController.addVehicleFuel.bind(vehicleFuelController));
router.get('/vehicle-fuel-list/:rider_id', ensureAuthenticated,checkAccessMiddleware(15), vehicleFuelController.getVehicleFuel.bind(vehicleFuelController));
router.get('/fuel/edit/:fuel_id', ensureAuthenticated,checkAccessMiddleware(15), vehicleFuelController.editVehicleFuel.bind(vehicleFuelController));
router.post('/fuel/update/:fuel_id', ensureAuthenticated,checkAccessMiddleware(15),upload, vehicleFuelController.updateVehicleFuel.bind(vehicleFuelController));












module.exports = router;
