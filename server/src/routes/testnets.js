import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createTestnet,
  getTestnets,
  getTestnet,
  updateTestnet,
  deleteTestnet,
  markTestnetComplete,
  getTestnetStats,
  getUpcomingDeadlines,
} from '../controllers/testnetController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const createTestnetValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Testnet name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('websiteUrl')
    .optional()
    .isURL()
    .withMessage('Website URL must be a valid URL'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  body('walletAddress')
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Wallet address must be a valid Ethereum address'),
  body('participationInterval')
    .isIn(['daily', '24hours', 'weekly', 'custom'])
    .withMessage('Participation interval must be daily, 24hours, weekly, or custom'),
  body('customInterval')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Custom interval must be between 1 and 168 hours'),
  body('deadlineType')
    .isIn(['daily', '24hour'])
    .withMessage('Deadline type must be daily or 24hour'),
  body('reminderTime')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Reminder time must be between 1 and 24 hours'),
  body('category')
    .optional()
    .isIn(['defi', 'gaming', 'nft', 'infrastructure', 'social', 'other'])
    .withMessage('Category must be a valid option'),
  body('blockchain')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Blockchain name must be between 2 and 50 characters'),
];

const updateTestnetValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('Testnet ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Testnet name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('websiteUrl')
    .optional()
    .isURL()
    .withMessage('Website URL must be a valid URL'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  body('walletAddress')
    .optional()
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Wallet address must be a valid Ethereum address'),
  body('participationInterval')
    .optional()
    .isIn(['daily', '24hours', 'weekly', 'custom'])
    .withMessage('Participation interval must be daily, 24hours, weekly, or custom'),
  body('customInterval')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Custom interval must be between 1 and 168 hours'),
  body('deadlineType')
    .optional()
    .isIn(['daily', '24hour'])
    .withMessage('Deadline type must be daily or 24hour'),
  body('reminderTime')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Reminder time must be between 1 and 24 hours'),
  body('category')
    .optional()
    .isIn(['defi', 'gaming', 'nft', 'infrastructure', 'social', 'other'])
    .withMessage('Category must be a valid option'),
  body('blockchain')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Blockchain name must be between 2 and 50 characters'),
];

const getTestnetsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['active', 'completed', 'missed', 'paused'])
    .withMessage('Status must be active, completed, missed, or paused'),
  query('category')
    .optional()
    .isIn(['defi', 'gaming', 'nft', 'infrastructure', 'social', 'other'])
    .withMessage('Category must be a valid option'),
  query('blockchain')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Blockchain filter cannot be empty'),
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'nextDeadline', 'blockchain'])
    .withMessage('Sort by must be name, createdAt, nextDeadline, or blockchain'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post('/', createTestnetValidation, validateRequest, createTestnet);
router.get('/', getTestnetsValidation, validateRequest, getTestnets);
router.get('/stats', getTestnetStats);
router.get('/upcoming-deadlines', getUpcomingDeadlines);
router.get('/:id', getTestnet);
router.put('/:id', updateTestnetValidation, validateRequest, updateTestnet);
router.delete('/:id', deleteTestnet);
router.post('/:id/complete', markTestnetComplete);

export default router;