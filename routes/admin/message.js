const express = require('express');
const router = express.Router();
const MessageController = require('../../controllers/admin/message');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');



// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/messages-list', ensureAuthenticated,checkAccessMiddleware(18), MessageController.getMessages.bind(MessageController));
router.get('/message-detail/:id', ensureAuthenticated,checkAccessMiddleware(18), MessageController.messageDetail.bind(MessageController)); // Edit form
router.post('/messages/update/:id', ensureAuthenticated,checkAccessMiddleware(18), MessageController.updateMessage.bind(MessageController)); // Update rider
router.delete('/messages/delete/:id', ensureAuthenticated,checkAccessMiddleware(18), MessageController.deleteMessage.bind(MessageController));


module.exports = router;
