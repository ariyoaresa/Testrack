import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getUserActivity,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  reportUser,
} from '../controllers/userController.js';

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  body('socialLinks')
    .optional()
    .isObject()
    .withMessage('Social links must be an object'),
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter link must be a valid URL'),
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('GitHub link must be a valid URL'),
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn link must be a valid URL'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

const reportValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('User ID is required'),
  body('reason')
    .isIn(['spam', 'harassment', 'inappropriate', 'fake', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateProfileValidation, validateRequest, updateUserProfile);
router.get('/stats', authenticateToken, getUserStats);
router.get('/activity', authenticateToken, queryValidation, validateRequest, getUserActivity);

// User search and discovery
router.get('/search', authenticateToken, queryValidation, validateRequest, searchUsers);

// Social features
router.post('/:id/follow', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, followUser);
router.delete('/:id/follow', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, unfollowUser);
router.get('/:id/followers', authenticateToken, param('id').isLength({ min: 1 }), queryValidation, validateRequest, getFollowers);
router.get('/:id/following', authenticateToken, param('id').isLength({ min: 1 }), queryValidation, validateRequest, getFollowing);

// Moderation
router.post('/:id/block', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, blockUser);
router.delete('/:id/block', authenticateToken, param('id').isLength({ min: 1 }), validateRequest, unblockUser);
router.post('/:id/report', authenticateToken, reportValidation, validateRequest, reportUser);

export default router;