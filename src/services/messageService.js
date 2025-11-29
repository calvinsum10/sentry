const prisma = require('../config/prisma');

async function saveIncomingMessage(message) {
  const updateData = {
    groupId: message.groupId,
    senderName: message.senderName,
    senderPhone: message.senderPhone,
    senderType: message.senderType,
    body: message.body,
    timestamp: message.timestamp,
  };

  // Preserve existing pending status unless an explicit value is provided
  if (typeof message.isPendingReply === 'boolean') {
    updateData.isPendingReply = message.isPendingReply;
  }

  return prisma.message.upsert({
    where: { id: message.id },
    update: updateData,
    create: {
      id: message.id,
      groupId: message.groupId,
      senderName: message.senderName,
      senderPhone: message.senderPhone,
      senderType: message.senderType,
      body: message.body,
      timestamp: message.timestamp,
      isPendingReply: message.isPendingReply ?? false,
    },
  });
}

async function getMessagesByGroup(groupId) {
  return prisma.message.findMany({
    where: { groupId },
    orderBy: { timestamp: 'desc' },
  });
}

async function getPendingMessages() {
  return prisma.message.findMany({
    where: {
      senderType: 'Merchant',
      isPendingReply: true,
    },
    orderBy: { timestamp: 'asc' },
  });
}

async function getPendingMessagesByGroup(groupId) {
  return prisma.message.findMany({
    where: {
      groupId,
      senderType: 'Merchant',
      isPendingReply: true,
    },
    orderBy: { timestamp: 'asc' },
  });
}

module.exports = {
  saveIncomingMessage,
  getMessagesByGroup,
  getPendingMessages,
  getPendingMessagesByGroup,
};
