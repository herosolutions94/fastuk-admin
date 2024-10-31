const express = require('express');
const router = express.Router();
const MessageController = require('../../controllers/admin/message');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');


// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/messages-list', ensureAuthenticated, MessageController.getMessages.bind(MessageController));
router.get('/message-detail/:id', ensureAuthenticated, MessageController.messageDetail.bind(MessageController)); // Edit form
router.post('/messages/update/:id', ensureAuthenticated, MessageController.updateMessage.bind(MessageController)); // Update rider
router.delete('/messages/delete/:id', ensureAuthenticated, MessageController.deleteMessage.bind(MessageController));


module.exports = router;
