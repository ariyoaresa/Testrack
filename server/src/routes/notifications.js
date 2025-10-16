import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  testNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get user notifications with filtering and pagination
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(['deadline', 'reminder', 'system', 'achievement'])
      .withMessage('Invalid notification type'),
    query('read')
      .optional()
      .isBoolean()
      .withMessage('Read must be a boolean'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority level'),
  ],
  validateRequest,
  getNotifications
);

// Mark notification as read
router.patch(
  '/:id/read',
  [
    param('id')
      .notEmpty()
      .withMessage('Notification ID is required'),
  ],
  validateRequest,
  markNotificationAsRead
);

// Mark all notifications as read
router.patch(
  '/read-all',
  markAllNotificationsAsRead
);

// Delete notification
router.delete(
  '/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Notification ID is required'),
  ],
  validateRequest,
  deleteNotification
);

// Get notification settings
router.get('/settings', getNotificationSettings);

// Update notification settings
router.put(
  '/settings',
  [
    body('emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('Email notifications must be a boolean'),
    body('pushNotifications')
      .optional()
      .isBoolean()
      .withMessage('Push notifications must be a boolean'),
    body('deadlineReminders')
      .optional()
      .isBoolean()
      .withMessage('Deadline reminders must be a boolean'),
    body('reminderTime')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('Reminder time must be between 1 and 168 hours'),
    body('quietHours')
      .optional()
      .isObject()
      .withMessage('Quiet hours must be an object'),
    body('quietHours.enabled')
      .optional()
      .isBoolean()
      .withMessage('Quiet hours enabled must be a boolean'),
    body('quietHours.start')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Start time must be in HH:MM format'),
    body('quietHours.end')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('End time must be in HH:MM format'),
    body('notificationTypes')
      .optional()
      .isObject()
      .withMessage('Notification types must be an object'),
    body('notificationTypes.deadline')
      .optional()
      .isBoolean()
      .withMessage('Deadline notifications must be a boolean'),
    body('notificationTypes.reminder')
      .optional()
      .isBoolean()
      .withMessage('Reminder notifications must be a boolean'),
    body('notificationTypes.system')
      .optional()
      .isBoolean()
      .withMessage('System notifications must be a boolean'),
    body('notificationTypes.achievement')
      .optional()
      .isBoolean()
      .withMessage('Achievement notifications must be a boolean'),
  ],
  validateRequest,
  updateNotificationSettings
);

// Test notification (for development/testing)
router.post(
  '/test',
  [
    body('type')
      .isIn(['deadline', 'reminder', 'system', 'achievement'])
      .withMessage('Invalid notification type'),
    body('title')
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('message')
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Message must be between 1 and 500 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority level'),
  ],
  validateRequest,
  testNotification
);

export default router;