// routes/api.js
const express = require('express');
const RemotePostCodeController = require('../../controllers/admin/remote-post-code');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');

const router = express.Router();
const remotePostCodeController = new RemotePostCodeController();
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');


router.get('/add-remote-post-code-form',checkAccessMiddleware(17), remotePostCodeController.renderAddRemotePostCodePage.bind(remotePostCodeController));

router.post('/add-remote-post-codes',checkAccessMiddleware(17), upload, ensureAuthenticated, remotePostCodeController.addRemotePostCode.bind(remotePostCodeController));
router.get('/remote-post-codes-list',checkAccessMiddleware(17), ensureAuthenticated, remotePostCodeController.getRemotePostCodes.bind(remotePostCodeController));
router.get('/remote-post-codes/edit/:id',checkAccessMiddleware(17), ensureAuthenticated, upload, remotePostCodeController.editRemotePostCode.bind(remotePostCodeController)); // Edit form
router.post('/remote-post-codes/update/:id',checkAccessMiddleware(17), ensureAuthenticated, upload, remotePostCodeController.updateRemotePostCode.bind(remotePostCodeController)); // Update rider
router.delete('/remote-post-codes/delete/:id',checkAccessMiddleware(17), ensureAuthenticated, remotePostCodeController.deleteRemotePostCode.bind(remotePostCodeController));




module.exports = router;
