// routes/api.js
const express = require('express');
const MemberController = require('../../controllers/api/memberController');
const upload = require('../../file-upload');

const router = express.Router();
const memberController = new MemberController();

// Route to register a rider
router.post('/register-members', upload, memberController.registerMember.bind(memberController));
router.post('/login', memberController.loginMember.bind(memberController));
router.post('/verify-email', memberController.verifyEmail.bind(memberController));
router.post('/request-password-reset', memberController.requestPasswordReset.bind(memberController));
router.post('/reset-password', memberController.resetPassword.bind(memberController));

module.exports = router;
