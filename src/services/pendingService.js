const prisma = require('../config/prisma');
const logger = require('../utils/logger');

async function updatePendingStateForMerchantMessage(messageId) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.senderType !== 'Merchant') return;

  const nextSupport = await prisma.message.findFirst({
    where: {
      groupId: message.groupId,
      senderType: 'SupportAgent',
      timestamp: { gt: message.timestamp },
    },
    orderBy: { timestamp: 'asc' },
  });

  const isPending = !nextSupport;

  if (message.isPendingReply !== isPending) {
    await prisma.message.update({
      where: { id: message.id },
      data: { isPendingReply: isPending },
    });
  }

  logger.info({
    event: 'pending_evaluated',
    messageId: message.id,
    isPendingReply: isPending,
  });
}

async function updatePendingStateForSupportMessage(messageId) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.senderType !== 'SupportAgent') return;

  const result = await prisma.message.updateMany({
    where: {
      groupId: message.groupId,
      senderType: 'Merchant',
      isPendingReply: true,
      timestamp: { lt: message.timestamp },
    },
    data: { isPendingReply: false },
  });

  logger.info({
    event: 'pending_resolved_by_support',
    supportMessageId: message.id,
    resolvedCount: result.count,
  });
}

module.exports = {
  updatePendingStateForMerchantMessage,
  updatePendingStateForSupportMessage,
};
