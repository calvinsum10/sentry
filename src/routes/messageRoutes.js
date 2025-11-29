const express = require('express');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.get('/health', messageController.health);
router.get('/pending', messageController.getPending);
router.get('/groups/:id/pending', messageController.getPendingByGroup);
router.get('/groups/:id/messages', messageController.getGroupMessages);

module.exports = router;
