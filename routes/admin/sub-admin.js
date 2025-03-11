// routes/api.js
const express = require('express');
const SubAdminController = require('../../controllers/admin/sub-admin');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const isAdmin  = require('../../middleware/isAdminMiddleware');

const router = express.Router();
const subAdminController = new SubAdminController();

router.get('/sub-admin/add',ensureAuthenticated, isAdmin, subAdminController.renderAddSubAdminPage.bind(subAdminController));

router.post('/add-sub-admin', ensureAuthenticated,isAdmin, upload, subAdminController.addSubAdmin.bind(subAdminController));
router.get('/sub-admins', ensureAuthenticated,isAdmin, subAdminController.getSubAdmins.bind(subAdminController));
router.get('/sub-admins/edit/:id', ensureAuthenticated,isAdmin, upload, subAdminController.editSubAdmin.bind(subAdminController)); // Edit form
router.post('/sub-admins/update/:id', ensureAuthenticated, upload, subAdminController.updateSubAdmin.bind(subAdminController)); // Update rider
router.delete('/sub-admins/delete/:id', ensureAuthenticated,isAdmin, subAdminController.deleteSubAdmin.bind(subAdminController));
router.get('/subadmin-permissions/:sub_admin_id', ensureAuthenticated,isAdmin, subAdminController.getPermissionsPage.bind(subAdminController));

router.post('/manage-permissions/:sub_admin_id', ensureAuthenticated,isAdmin, subAdminController.manageSubAdminPermissions.bind(subAdminController));





module.exports = router;
