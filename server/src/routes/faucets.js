import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  getFaucets,
  getFaucetById,
  createFaucet,
  updateFaucet,
  deleteFaucet,
  searchFaucets,
  getFaucetsByNetwork,
  rateFaucet,
  reportFaucet,
  getFaucetStats,
  verifyFaucet,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from '../controllers/faucetController.js';

const router = express.Router();

// Validation rules
const createFaucetValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('url')
    .isURL()
    .withMessage('Must be a valid URL'),
  body('network')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Network must be between 2 and 50 characters'),
  body('chainId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Chain ID must be a positive integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('tokenSymbol')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Token symbol must be between 1 and 10 characters'),
  body('dailyLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily limit must be a positive number'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each requirement must be between 1 and 200 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('socialLinks')
    .optional()
    .isObject()
    .withMessage('Social links must be an object'),
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter link must be a valid URL'),
  body('socialLinks.discord')
    .optional()
    .isURL()
    .withMessage('Discord link must be a valid URL'),
  body('socialLinks.telegram')
    .optional()
    .isURL()
    .withMessage('Telegram link must be a valid URL'),
];

const updateFaucetValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('Faucet ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('Must be a valid URL'),
  body('network')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Network must be between 2 and 50 characters'),
  body('chainId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Chain ID must be a positive integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('tokenSymbol')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Token symbol must be between 1 and 10 characters'),
  body('dailyLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily limit must be a positive number'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('network')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Network filter cannot be empty'),
  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return value.split(',').every(tag => tag.trim().length > 0);
      }
      return Array.isArray(value) && value.every(tag => typeof tag === 'string' && tag.trim().length > 0);
    })
    .withMessage('Tags must be valid strings'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('sortBy')
    .optional()
    .isIn(['name', 'network', 'rating', 'createdAt', 'updatedAt', 'usageCount'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

const ratingValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('Faucet ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters'),
];

const reportValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('Faucet ID is required'),
  body('reason')
    .isIn(['broken', 'scam', 'inappropriate', 'duplicate', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

// Public routes
router.get('/', queryValidation, validateRequest, optionalAuth, getFaucets);
router.get('/search', queryValidation, validateRequest, optionalAuth, searchFaucets);
router.get('/network/:network', queryValidation, validateRequest, optionalAuth, getFaucetsByNetwork);
router.get('/stats', getFaucetStats);
router.get('/:id', param('id').isLength({ min: 1 }), validateRequest, optionalAuth, getFaucetById);

// Protected routes (require authentication)
router.post('/', authenticateToken, createFaucetValidation, validateRequest, createFaucet);
router.put('/:id', authenticateToken, updateFaucetValidation, validateRequest, updateFaucet);
router.delete('/:id', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, deleteFaucet);

// Rating and reporting
router.post('/:id/rate', authenticateToken, ratingValidation, validateRequest, rateFaucet);
router.post('/:id/report', authenticateToken, reportValidation, validateRequest, reportFaucet);

// Admin routes (require admin privileges)
router.post('/:id/verify', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, verifyFaucet);

// User favorites
router.get('/user/favorites', authenticateToken, getFavorites);
router.post('/:id/favorite', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, addToFavorites);
router.delete('/:id/favorite', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, removeFromFavorites);

export default router;