const express = require('express');
const router = express.Router();
const RiderController = require('../../controllers/admin/rider');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');


// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/riders', ensureAuthenticated, RiderController.getRiders.bind(RiderController));
router.get('/riders/edit/:id', ensureAuthenticated, upload, RiderController.editRider.bind(RiderController)); // Edit form
router.post('/riders/update/:id', ensureAuthenticated, upload, RiderController.updateRider.bind(RiderController)); // Update rider
router.get("/delete-image/:id/:rider_id", ensureAuthenticated, RiderController.deleteRiderPicture.bind(RiderController));

router.delete('/riders/delete/:id', ensureAuthenticated, RiderController.deleteRider.bind(RiderController));
router.get('/riders/documents/create/:rider_id', ensureAuthenticated, RiderController.renderCreateDocumentForm.bind(RiderController));

router.post('/riders/documents/create/:rider_id',ensureAuthenticated,upload, RiderController.createDocumentRequest.bind(RiderController));
router.get('/riders/documents/:rider_id',ensureAuthenticated,upload, RiderController.getRiderDocuments.bind(RiderController));
router.get('/riders/documents/edit/:rider_id/:document_id', 
    ensureAuthenticated, upload,
    RiderController.renderEditDocumentForm.bind(RiderController)
);

router.post('/riders/documents/edit/:rider_id/:document_id',ensureAuthenticated,upload, 
    RiderController.updateDocument.bind(RiderController)
);
router.delete('/riders/documents/delete/:rider_id/:document_id',ensureAuthenticated,upload, 
    RiderController.deleteDocument.bind(RiderController)
);

router.get('/riders/documents/update-status/:id', ensureAuthenticated, upload, RiderController.updateDocumentStatus.bind(RiderController));
router.get('/riders/update-status/:id',ensureAuthenticated, upload, RiderController.handleRiderApprove.bind(RiderController));






module.exports = router;
