// routes/api.js
const express = require('express');
const TeamController = require('../../controllers/admin/team');
const upload = require('../../file-upload');

const router = express.Router();
const teamController = new TeamController();
const { ensureAuthenticated, redirectIfAuthenticated } = require('../../middleware/authMiddleware');


router.get('/team-members/add', ensureAuthenticated, teamController.renderAddTeamPage.bind(teamController));

router.post('/add-team-members', ensureAuthenticated, upload, teamController.addTeamMember.bind(teamController));
router.get('/team-members', ensureAuthenticated, teamController.getTeamMembers.bind(teamController));
router.get('/team-members/edit/:id', ensureAuthenticated, upload, teamController.editTeamMember.bind(teamController)); // Edit form
router.post('/team-members/update/:id', ensureAuthenticated, upload, teamController.updateTeamMember.bind(teamController)); // Update rider
router.delete('/team-members/delete/:id', ensureAuthenticated, teamController.deleteTeamMember.bind(teamController));




module.exports = router;
