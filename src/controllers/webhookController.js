const messageService = require('../services/messageService');
const pendingService = require('../services/pendingService');
const logger = require('../utils/logger');

function normalizeTimestamp(rawTimestamp) {
  if (!rawTimestamp) return new Date();

  const numericTs = Number(rawTimestamp);
  if (!Number.isNaN(numericTs)) {
    // Handle seconds vs milliseconds
    if (`${Math.abs(numericTs)}`.length >= 13) {
      return new Date(numericTs);
    }
    return new Date(numericTs * 1000);
  }

  const parsed = new Date(rawTimestamp);
  // Fallback to now if invalid
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseWebhookPayload(body) {
  try {
    const parsedMessages = [];
    const entries = body?.entry || [];

    entries.forEach((entry) => {
      const change = entry?.changes?.[0];
      const value = change?.value || {};
      const messages = value.messages || [];
      const contacts = value.contacts || [];

      messages.forEach((message, idx) => {
        const contact = contacts[idx] || contacts[0] || {};
        const messageId = message.id || body.message_id;
        const groupId = message.group_id || value.group_id || message.chat_id || message.chatId || 'unknown-group';
        const senderPhone = message.from || body.sender_phone;
        const senderName = contact.profile?.name || body.sender_name || senderPhone || 'Unknown';
        const bodyText = message.text?.body || message.body || body.message_body || '';
        const timestamp = normalizeTimestamp(message.timestamp || body.timestamp);

        if (messageId) {
          parsedMessages.push({
            id: messageId,
            groupId,
            senderName,
            senderPhone,
            body: bodyText,
            timestamp,
          });
        }
      });
    });

    // Fallback for simplified payloads without entry/changes wrapper
    if (!parsedMessages.length && (body.message_id || body.id)) {
      parsedMessages.push({
        id: body.message_id || body.id,
        groupId: body.group_id || body.chat_id || body.chatId || 'unknown-group',
        senderName: body.sender_name || body.from || 'Unknown',
        senderPhone: body.sender_phone || body.from,
        body: body.message_body || body.body || '',
        timestamp: normalizeTimestamp(body.timestamp),
      });
    }

    return parsedMessages;
  } catch (err) {
    logger.error({ event: 'parse_error', error: err.message });
    return [];
  }
}

function classifySenderType(senderName) {
  if (!senderName) return 'Merchant';
  return senderName.startsWith('FeedMe_') ? 'SupportAgent' : 'Merchant';
}

async function handleWebhook(req, res) {
  const parsedMessages = parseWebhookPayload(req.body);

  if (!parsedMessages.length) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const processedIds = [];

    for (const parsed of parsedMessages) {
      const senderType = classifySenderType(parsed.senderName);
      const messageData = { ...parsed, senderType };

      const savedMessage = await messageService.saveIncomingMessage(messageData);
      logger.info({
        level: 'info',
        event: 'webhook_received',
        messageId: savedMessage.id,
        groupId: savedMessage.groupId,
        senderType: savedMessage.senderType,
        timestamp: savedMessage.timestamp,
      });

      if (senderType === 'Merchant') {
        await pendingService.updatePendingStateForMerchantMessage(savedMessage.id);
      } else {
        await pendingService.updatePendingStateForSupportMessage(savedMessage.id);
      }

      processedIds.push(savedMessage.id);
    }

    return res.status(200).json({ status: 'received', processed: processedIds });
  } catch (err) {
    logger.error({ event: 'webhook_error', error: err.message });
    return res.status(500).json({ error: 'Failed to process message' });
  }
}

module.exports = { handleWebhook };
