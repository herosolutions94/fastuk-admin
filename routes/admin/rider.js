const express = require('express');
const router = express.Router();
const RiderController = require('../../controllers/admin/rider');
const upload = require('../../file-upload');
const { ensureAuthenticated } = require('../../middleware/authMiddleware');
const checkAccessMiddleware = require('../../middleware/checkAccessMiddleware');


// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/riders', ensureAuthenticated, checkAccessMiddleware(3), RiderController.getRiders.bind(RiderController));
router.get('/riders/edit/:id', ensureAuthenticated, checkAccessMiddleware(3), upload, RiderController.editRider.bind(RiderController)); // Edit form
router.post('/riders/update/:id', ensureAuthenticated, checkAccessMiddleware(3), upload, RiderController.updateRider.bind(RiderController)); // Update rider
router.get("/delete-image/:id/:rider_id", ensureAuthenticated, checkAccessMiddleware(3), RiderController.deleteRiderPicture.bind(RiderController));

router.delete('/riders/delete/:id', ensureAuthenticated, checkAccessMiddleware(3), RiderController.deleteRider.bind(RiderController));
router.get('/riders/documents/create/:rider_id', ensureAuthenticated, RiderController.renderCreateDocumentForm.bind(RiderController));

router.post('/riders/documents/create/:rider_id',ensureAuthenticated, checkAccessMiddleware(3),upload, RiderController.createDocumentRequest.bind(RiderController));
router.get('/riders/documents/:rider_id',ensureAuthenticated, checkAccessMiddleware(3),upload, RiderController.getRiderDocuments.bind(RiderController));
router.get('/riders/documents/edit/:rider_id/:document_id', 
    ensureAuthenticated, checkAccessMiddleware(3), upload,
    RiderController.renderEditDocumentForm.bind(RiderController)
);

router.post('/riders/documents/edit/:rider_id/:document_id',ensureAuthenticated, checkAccessMiddleware(3),upload, 
    RiderController.updateDocument.bind(RiderController)
);
router.delete('/riders/documents/delete/:rider_id/:document_id',ensureAuthenticated, checkAccessMiddleware(3),upload, 
    RiderController.deleteDocument.bind(RiderController)
);

router.get('/riders/documents/update-status/:id', ensureAuthenticated, checkAccessMiddleware(3), upload, RiderController.updateDocumentStatus.bind(RiderController));
router.get('/riders/update-status/:id',ensureAuthenticated, checkAccessMiddleware(3), upload, RiderController.handleRiderApprove.bind(RiderController));

router.get('/rider/:rider_id/jobs', ensureAuthenticated, checkAccessMiddleware(3), upload, RiderController.getRiderJobs.bind(RiderController));







module.exports = router;
