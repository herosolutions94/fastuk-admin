// routes/api.js
const express = require('express');
const CategoryController = require('../../controllers/admin/categoryController');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const categoryController = new CategoryController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/rider/category/add-category-form/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), categoryController.renderAddCategoryPage.bind(categoryController));
router.post('/rider/category/add-category-form/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), categoryController.saveCategoryForRider.bind(categoryController));
router.post('/rider/category/fetch-subcategories/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), categoryController.fetchSubCategories.bind(categoryController));
// router.post('/rider/category/save-category/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), categoryController.saveCategoryForRider.bind(categoryController));
router.get('/rider/category/selected-categories/:rider_id', ensureAuthenticated, checkAccessMiddleware(21), categoryController.getRiderCategories.bind(categoryController));
router.get('/rider/category/edit/:rider_id/:category_id', ensureAuthenticated, categoryController.renderEditAssignedCategory.bind(categoryController));

router.post('/rider/category/update/:riderId/:category_id', ensureAuthenticated, upload, categoryController.updateAssignedCategory.bind(categoryController));

router.delete(
  '/rider/category/delete/:rider_id/:id',
  ensureAuthenticated,
  checkAccessMiddleware(21), upload,
  categoryController.deleteRiderCategory.bind(categoryController)
);








module.exports = router;
