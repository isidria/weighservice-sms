import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as messageController from '../controllers/messageController.js';

const router = express.Router();

// Twilio webhook - no authentication required
router.post('/twilio/incoming', asyncHandler(messageController.handleWebhook));

export default router;
