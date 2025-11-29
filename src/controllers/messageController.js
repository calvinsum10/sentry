const messageService = require('../services/messageService');
const { calculateAgeMinutes } = require('../utils/time');
const logger = require('../utils/logger');

async function health(req, res) {
  return res.json({ status: 'ok' });
}

async function getPending(req, res) {
  try {
    const pending = await messageService.getPendingMessages();
    const enriched = pending.map((msg) => ({
      id: msg.id,
      groupId: msg.groupId,
      senderName: msg.senderName,
      body: msg.body,
      timestamp: msg.timestamp,
      ageMinutes: calculateAgeMinutes(msg.timestamp),
    }));
    return res.json(enriched);
  } catch (err) {
    logger.error({ event: 'get_pending_error', error: err.message });
    return res.status(500).json({ error: 'Failed to fetch pending messages' });
  }
}

async function getPendingByGroup(req, res) {
  const { id } = req.params;
  try {
    const pending = await messageService.getPendingMessagesByGroup(id);
    const enriched = pending.map((msg) => ({
      id: msg.id,
      groupId: msg.groupId,
      senderName: msg.senderName,
      body: msg.body,
      timestamp: msg.timestamp,
      ageMinutes: calculateAgeMinutes(msg.timestamp),
    }));
    return res.json(enriched);
  } catch (err) {
    logger.error({ event: 'get_group_pending_error', error: err.message });
    return res.status(500).json({ error: 'Failed to fetch pending messages for group' });
  }
}

async function getGroupMessages(req, res) {
  const { id } = req.params;
  try {
    const messages = await messageService.getMessagesByGroup(id);
    return res.json(messages);
  } catch (err) {
    logger.error({ event: 'get_group_messages_error', error: err.message });
    return res.status(500).json({ error: 'Failed to fetch messages for group' });
  }
}

module.exports = {
  health,
  getPending,
  getPendingByGroup,
  getGroupMessages,
};
