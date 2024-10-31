// routes/api.js
const express = require('express');
const MessageController = require('../../controllers/api/messageController');
const upload = require('../../file-upload');

const router = express.Router();
const messageController = new MessageController();

// Route to register a rider
router.post('/send-message', upload, messageController.sendMessage.bind(messageController));


module.exports = router;
