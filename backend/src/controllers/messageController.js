import { Message, Conversation } from '../models/index.js';
import { sendMessage, handleIncomingMessage } from '../services/smsService.js';
import { AppError } from '../middleware/errorHandler.js';

export const sendDirectMessage = async (req, res, next) => {
  try {
    const { conversationId, body, mediaUrls } = req.body;

    if (!conversationId || !body) {
      throw new AppError('Conversation ID and body are required', 400);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Send SMS/MMS via Twilio
    const sendResult = await sendMessage(conversation.customer_phone, body, mediaUrls);

    // Store message
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: req.user.userId,
      sender_type: 'agent',
      recipient_phone: conversation.customer_phone,
      body,
      media_urls: mediaUrls || [],
      message_type: mediaUrls ? 'mms' : 'sms',
      twilio_sid: sendResult.sid,
      status: 'sent',
    });

    // Update conversation
    await Conversation.update(conversationId, { updated_at: new Date() });

    res.status(201).json({
      success: true,
      data: message,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filters = {};

    if (status) filters.status = status;

    const conversations = await Conversation.findAll(filters);

    res.json({
      success: true,
      data: conversations,
      count: conversations.length,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.getWithMessages(id);

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    res.json({
      success: true,
      data: conversation,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const updateConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const conversation = await Conversation.update(id, { status });

    res.json({
      success: true,
      data: conversation,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const result = await handleIncomingMessage(req.body);

    res.status(200).json({
      success: true,
      data: result,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
