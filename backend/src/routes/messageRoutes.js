import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import * as messageController from '../controllers/messageController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/send', asyncHandler(messageController.sendDirectMessage));
router.get('/conversations', asyncHandler(messageController.getConversations));
router.get('/conversations/:id', asyncHandler(messageController.getConversationById));
router.put('/conversations/:id', asyncHandler(messageController.updateConversation));

export default router;
