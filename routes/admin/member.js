const express = require('express');
const router = express.Router();
const MemberController = require('../../controllers/admin/member');
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');

const upload = require('../../file-upload');

// router.get('/riders', (req, res) => {
//     RiderController.getRiders(req, res);
// });
router.get('/members-list',ensureAuthenticated, MemberController.getMembers.bind(MemberController));
router.get('/members/edit/:id',ensureAuthenticated, MemberController.editMember.bind(MemberController)); // Edit form
router.post('/members/update/:id', ensureAuthenticated, upload, MemberController.updateMember.bind(MemberController)); // Update rider
router.delete('/members/delete/:id', ensureAuthenticated, MemberController.deleteMember.bind(MemberController));


module.exports = router;
