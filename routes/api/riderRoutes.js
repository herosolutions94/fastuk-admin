// routes/api.js
const express = require('express');
const RiderController = require('../../controllers/api/riderController');
const upload = require('../../file-upload');

const router = express.Router();
const riderController = new RiderController();

// Route to register a rider
router.post('/register-riders', upload, riderController.registerRider.bind(riderController));
router.post('/login', riderController.loginRider.bind(riderController));
router.post('/verify-email', riderController.verifyEmail.bind(riderController));

module.exports = router;
