import { twilioClient, twilioPhoneNumber } from '../config/twilio.js';
import { Message, Conversation } from '../models/index.js';
import { logger } from '../middleware/logger.js';

export const sendMessage = async (toPhone, body, mediaUrls = []) => {
  try {
    const msgData = {
      body,
      from: twilioPhoneNumber,
      to: toPhone,
    };

    if (mediaUrls && mediaUrls.length > 0) {
      msgData.mediaUrl = mediaUrls;
    }

    const response = await twilioClient.messages.create(msgData);

    logger.info(`Message sent to ${toPhone}, SID: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    logger.error(`Failed to send message: ${error.message}`);
    throw error;
  }
};

export const handleIncomingMessage = async (data) => {
  try {
    const { From, To, Body, NumMedia, Media0UrL } = data;

    // Find or create conversation
    let conversation = await Conversation.findByPhone(From);
    if (!conversation) {
      // Try to find customer first
      let customer = await require('../models/index.js').Customer.findByPhone(From);
      if (!customer) {
        customer = await require('../models/index.js').Customer.create({
          name: From,
          phone: From,
          email: null,
          company: 'Unknown',
        });
      }

      conversation = await Conversation.create({
        customer_id: customer.id,
        customer_phone: From,
        customer_name: customer.name,
        subject: 'Support Request',
        status: 'open',
      });
    }

    // Store message
    const mediaUrls = NumMedia > 0 ? [Media0UrL] : [];
    const message = await Message.create({
      conversation_id: conversation.id,
      sender_id: From,
      sender_type: 'customer',
      recipient_phone: To,
      body: Body,
      media_urls: mediaUrls,
      message_type: NumMedia > 0 ? 'mms' : 'sms',
      status: 'received',
    });

    // Update conversation
    await Conversation.update(conversation.id, {
      status: 'open',
      updated_at: new Date(),
    });

    return { success: true, message, conversation };
  } catch (error) {
    logger.error(`Error handling incoming message: ${error.message}`);
    throw error;
  }
};
