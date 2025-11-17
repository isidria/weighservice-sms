import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import * as customerController from '../controllers/customerController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', asyncHandler(customerController.createCustomer));
router.get('/', asyncHandler(customerController.getCustomers));
router.get('/:id', asyncHandler(customerController.getCustomerById));
router.put('/:id', asyncHandler(customerController.updateCustomer));
router.delete('/:id', asyncHandler(customerController.deleteCustomer));

export default router;
