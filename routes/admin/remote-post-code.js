// routes/api.js
const express = require('express');
const RemotePostCodeController = require('../../controllers/admin/remote-post-code');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const remotePostCodeController = new RemotePostCodeController();

router.get('/add-remote-post-code-form', remotePostCodeController.renderAddRemotePostCodePage.bind(remotePostCodeController));

router.post('/add-remote-post-codes', upload, ensureAuthenticated, remotePostCodeController.addRemotePostCode.bind(remotePostCodeController));
router.get('/remote-post-codes-list', ensureAuthenticated, remotePostCodeController.getRemotePostCodes.bind(remotePostCodeController));
router.get('/remote-post-codes/edit/:id', ensureAuthenticated, upload, remotePostCodeController.editRemotePostCode.bind(remotePostCodeController)); // Edit form
router.post('/remote-post-codes/update/:id', ensureAuthenticated, upload, remotePostCodeController.updateRemotePostCode.bind(remotePostCodeController)); // Update rider
router.delete('/remote-post-codes/delete/:id', ensureAuthenticated, remotePostCodeController.deleteRemotePostCode.bind(remotePostCodeController));




module.exports = router;
