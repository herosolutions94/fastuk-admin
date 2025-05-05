// routes/api.js
const express = require('express');
const VehicleCategoryController = require('../../controllers/admin/vehicle-categories');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const vehicleCategoryController = new VehicleCategoryController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/add-vehicle-category-form', vehicleCategoryController.renderAddVehicleCategoryPage.bind(vehicleCategoryController));

router.post('/add-vehicle-categories', ensureAuthenticated, upload, vehicleCategoryController.addVehicleCategory.bind(vehicleCategoryController));
router.get('/vehicle-categories-list', ensureAuthenticated, vehicleCategoryController.getVehicleCategories.bind(vehicleCategoryController));
router.get('/vehicle-categories/edit/:id', ensureAuthenticated, upload, vehicleCategoryController.editVehicleCategory.bind(vehicleCategoryController)); // Edit form
router.post('/vehicle-categories/update/:id', ensureAuthenticated, upload, vehicleCategoryController.updateVehicleCategory.bind(vehicleCategoryController)); // Update rider
router.delete('/vehicle-categories/delete/:id', ensureAuthenticated, vehicleCategoryController.deleteVehicleCategory.bind(vehicleCategoryController));




module.exports = router;
