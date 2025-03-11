const express = require('express');
const router = express.Router();
const MemberController = require('../../controllers/admin/member');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');

const upload = require('../../file-upload');

// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/members',ensureAuthenticated,checkAccessMiddleware(2), MemberController.getMembers.bind(MemberController));
router.get('/members/edit/:id',ensureAuthenticated,checkAccessMiddleware(2), MemberController.editMember.bind(MemberController)); // Edit form
router.post('/members/update/:id', ensureAuthenticated,checkAccessMiddleware(2), upload, MemberController.updateMember.bind(MemberController)); // Update rider
router.delete('/members/delete/:id', ensureAuthenticated,checkAccessMiddleware(2), MemberController.deleteMember.bind(MemberController));
// router.get('/members/edit/:id', ensureAuthenticated, MemberController.getStates.bind(MemberController));



module.exports = router;
