import { getFirestore } from '../config/firebase.js';
import { sendEmail } from '../services/emailService.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

const db = getFirestore();

// Get user notifications with filtering and pagination
export const getNotifications = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const {
      page = 1,
      limit = 20,
      type,
      read,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let query = db.collection('notifications').where('userId', '==', uid);

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }
    if (read !== undefined) {
      query = query.where('read', '==', read === 'true');
    }
    if (priority) {
      query = query.where('priority', '==', priority);
    }

    // Apply sorting
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, sortDirection);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const notifications = [];

    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Get total count for pagination
    const countQuery = db.collection('notifications').where('userId', '==', uid);
    const countSnapshot = await countQuery.get();
    const totalCount = countSnapshot.size;

    // Get unread count
    const unreadQuery = db.collection('notifications')
      .where('userId', '==', uid)
      .where('read', '==', false);
    const unreadSnapshot = await unreadQuery.get();
    const unreadCount = unreadSnapshot.size;

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          unreadCount,
          hasNextPage: parseInt(page) * parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Get notification to verify ownership
    const doc = await db.collection('notifications').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    const notificationData = doc.data();

    // Check if user owns this notification
    if (notificationData.userId !== uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Update notification
    await db.collection('notifications').doc(id).update({
      read: true,
      readAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const { uid } = req.user;

    // Get all unread notifications for the user
    const snapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .where('read', '==', false)
      .get();

    // Batch update all unread notifications
    const batch = db.batch();
    const now = new Date().toISOString();

    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: now,
      });
    });

    await batch.commit();

    res.json({
      success: true,
      message: `${snapshot.size} notifications marked as read`,
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Get notification to verify ownership
    const doc = await db.collection('notifications').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    const notificationData = doc.data();

    // Check if user owns this notification
    if (notificationData.userId !== uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Delete notification
    await db.collection('notifications').doc(id).delete();

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get notification settings
export const getNotificationSettings = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const doc = await db.collection('notificationSettings').doc(uid).get();

    let settings;
    if (doc.exists) {
      settings = doc.data();
    } else {
      // Return default settings
      settings = {
        emailNotifications: true,
        pushNotifications: true,
        deadlineReminders: true,
        reminderTime: 12, // hours before deadline
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
        notificationTypes: {
          deadline: true,
          reminder: true,
          system: true,
          achievement: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save default settings
      await db.collection('notificationSettings').doc(uid).set(settings);
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const updateData = req.body;

    const now = new Date().toISOString();
    const finalUpdateData = {
      ...updateData,
      updatedAt: now,
    };

    // Update or create settings
    await db.collection('notificationSettings').doc(uid).set(finalUpdateData, { merge: true });

    // Get updated settings
    const doc = await db.collection('notificationSettings').doc(uid).get();
    const settings = doc.data();

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// Test notification (for development/testing)
export const testNotification = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { type, title, message, priority = 'medium' } = req.body;

    // Create test notification
    const notificationData = {
      userId: uid,
      type,
      title,
      message,
      priority,
      read: false,
      createdAt: new Date().toISOString(),
      testNotification: true,
    };

    const docRef = await db.collection('notifications').add(notificationData);

    // Get user settings to determine delivery method
    const settingsDoc = await db.collection('notificationSettings').doc(uid).get();
    const settings = settingsDoc.exists ? settingsDoc.data() : { emailNotifications: true };

    // Send email notification if enabled
    if (settings.emailNotifications) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        await sendEmail(
          userData.email,
          `Test Notification: ${title}`,
          message,
          'notification'
        );
      }
    }

    res.json({
      success: true,
      message: 'Test notification created and sent',
      data: {
        id: docRef.id,
        ...notificationData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create notification (used by other services)
export const createNotification = async (userId, notificationData) => {
  try {
    const notification = {
      userId,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('notifications').add(notification);

    // Get user settings
    const settingsDoc = await db.collection('notificationSettings').doc(userId).get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};

    // Check if notification type is enabled
    const typeEnabled = settings.notificationTypes?.[notification.type] !== false;
    
    if (!typeEnabled) {
      return { id: docRef.id, ...notification };
    }

    // Check quiet hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    if (settings.quietHours?.enabled) {
      const { start, end } = settings.quietHours;
      const isQuietTime = (start <= end) 
        ? (currentTime >= start && currentTime <= end)
        : (currentTime >= start || currentTime <= end);
      
      if (isQuietTime && notification.priority !== 'critical') {
        return { id: docRef.id, ...notification };
      }
    }

    // Send email notification if enabled
    if (settings.emailNotifications) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        await sendEmail(
          userData.email,
          notification.title,
          notification.message,
          'notification'
        );
      }
    }

    // Send push notification if enabled
    if (settings.pushNotifications) {
      await sendPushNotification(userId, notification);
    }

    return { id: docRef.id, ...notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};