// routes/api.js
const express = require('express');
const AssignedVehicleController = require('../../controllers/admin/assignedVehicles');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const assignedVehicleController = new AssignedVehicleController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/rider/vehicle/assign-vehicle-form/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), assignedVehicleController.renderAssignVehiclePage.bind(assignedVehicleController));
// router.post('/rider/category/add-category-form/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), assignedVehicleController.saveCategoryForRider.bind(assignedVehicleController));
// router.post('/rider/category/fetch-subcategories/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), assignedVehicleController.fetchSubCategories.bind(assignedVehicleController));
router.post('/rider/vehicles/assign-vehicle/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), assignedVehicleController.assignVehicleToRider.bind(assignedVehicleController));
router.get('/rider/vehicles/assigned-vehicles/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), assignedVehicleController.getRiderAssignedVehicles.bind(assignedVehicleController));
router.get('/rider/vehicle/edit/:rider_id/:vehicle_id', ensureAuthenticated, assignedVehicleController.renderEditAssignedVehicle.bind(assignedVehicleController));

router.post('/rider/vehicle/update/:riderId/:vehicle_id', ensureAuthenticated, assignedVehicleController.updateAssignedVehicle.bind(assignedVehicleController));

router.delete(
  '/rider/vehicle/delete/:rider_id/:vehicle_id',
  ensureAuthenticated,
  checkAccessMiddleware(21),
  assignedVehicleController.deleteRiderAssignedVehicle.bind(assignedVehicleController)
);








module.exports = router;
