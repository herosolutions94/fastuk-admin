// routes/api.js
const express = require('express');
const TeamController = require('../../controllers/admin/team');
const upload = require('../../file-upload');

const router = express.Router();
const teamController = new TeamController();
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');
const  checkAccessMiddleware  = require('../../middleware/checkAccessMiddleware');



router.get('/team-members/add', ensureAuthenticated, checkAccessMiddleware(11), teamController.renderAddTeamPage.bind(teamController));

router.post('/add-team-members', ensureAuthenticated,checkAccessMiddleware(11), upload, teamController.addTeamMember.bind(teamController));
router.get('/team-members', ensureAuthenticated, checkAccessMiddleware(11), teamController.getTeamMembers.bind(teamController));
router.get('/team-members/edit/:id', ensureAuthenticated, checkAccessMiddleware(11), upload, teamController.editTeamMember.bind(teamController)); // Edit form
router.post('/team-members/update/:id', ensureAuthenticated, checkAccessMiddleware(11), upload, teamController.updateTeamMember.bind(teamController)); // Update rider
router.delete('/team-members/delete/:id', ensureAuthenticated, checkAccessMiddleware(11), teamController.deleteTeamMember.bind(teamController));




module.exports = router;
