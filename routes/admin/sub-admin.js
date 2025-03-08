// routes/api.js
const express = require('express');
const SubAdminController = require('../../controllers/admin/sub-admin');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const subAdminController = new SubAdminController();

router.get('/sub-admin/add', subAdminController.renderAddSubAdminPage.bind(subAdminController));

router.post('/add-sub-admin', ensureAuthenticated, upload, subAdminController.addSubAdmin.bind(subAdminController));
router.get('/sub-admins', ensureAuthenticated, subAdminController.getSubAdmins.bind(subAdminController));
router.get('/sub-admins/edit/:id', ensureAuthenticated, upload, subAdminController.editSubAdmin.bind(subAdminController)); // Edit form
router.post('/sub-admins/update/:id', ensureAuthenticated, upload, subAdminController.updateSubAdmin.bind(subAdminController)); // Update rider
router.delete('/sub-admins/delete/:id', ensureAuthenticated, subAdminController.deleteSubAdmin.bind(subAdminController));
router.get('/subadmin-permissions/:sub_admin_id', ensureAuthenticated, subAdminController.getPermissionsPage.bind(subAdminController));

router.post('/manage-permissions/:sub_admin_id', ensureAuthenticated, subAdminController.manageSubAdminPermissions.bind(subAdminController));





module.exports = router;
