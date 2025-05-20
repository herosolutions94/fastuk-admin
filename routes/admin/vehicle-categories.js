// routes/api.js
const express = require('express');
const VehicleCategoryController = require('../../controllers/admin/vehicle-categories');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const vehicleCategoryController = new VehicleCategoryController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/add-vehicle-category-form', ensureAuthenticated, checkAccessMiddleware(21), vehicleCategoryController.renderAddVehicleCategoryPage.bind(vehicleCategoryController));

router.post('/add-vehicle-categories', ensureAuthenticated, checkAccessMiddleware(21), upload, vehicleCategoryController.addVehicleCategory.bind(vehicleCategoryController));
router.get('/vehicle-categories-list', ensureAuthenticated, checkAccessMiddleware(21), vehicleCategoryController.getVehicleCategories.bind(vehicleCategoryController));
router.get('/vehicle-categories/edit/:id', ensureAuthenticated, checkAccessMiddleware(21), upload, vehicleCategoryController.editVehicleCategory.bind(vehicleCategoryController)); // Edit form
router.post('/vehicle-categories/update/:id', ensureAuthenticated, checkAccessMiddleware(21), upload, vehicleCategoryController.updateVehicleCategory.bind(vehicleCategoryController)); // Update rider
router.delete('/vehicle-categories/delete/:id', ensureAuthenticated, checkAccessMiddleware(21), vehicleCategoryController.deleteVehicleCategory.bind(vehicleCategoryController));




module.exports = router;
