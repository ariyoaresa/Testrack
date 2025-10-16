import { getMessaging } from '../config/firebase.js';
import { getFirestore } from '../config/firebase.js';

const messaging = getMessaging();
const db = getFirestore();

/**
 * Send push notification to a user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Send result
 */
export const sendPushNotification = async (userId, notification) => {
  try {
    // Get user's FCM tokens
    const tokensSnapshot = await db.collection('fcmTokens')
      .where('userId', '==', userId)
      .where('active', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      console.log(`No active FCM tokens found for user ${userId}`);
      return { success: false, reason: 'No active tokens' };
    }

    const tokens = [];
    tokensSnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    // Prepare message
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        priority: notification.priority,
        notificationId: notification.id || '',
        createdAt: notification.createdAt || new Date().toISOString(),
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#3B82F6',
          sound: 'default',
          priority: notification.priority === 'critical' ? 'high' : 'normal',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            priority: notification.priority === 'critical' ? 10 : 5,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: notification.priority === 'critical' ? [200, 100, 200] : [100],
        },
      },
    };

    // Send to multiple tokens
    const results = await Promise.allSettled(
      tokens.map(token => 
        messaging.send({ ...message, token })
      )
    );

    // Process results and handle invalid tokens
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failedTokens = [];

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason;
        console.error(`Failed to send to token ${tokens[index]}:`, error.message);
        
        // Check if token is invalid
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
          failedTokens.push(tokens[index]);
        }
      }
    });

    // Remove invalid tokens
    if (failedTokens.length > 0) {
      await removeInvalidTokens(failedTokens);
    }

    return {
      success: successCount > 0,
      successCount,
      totalTokens: tokens.length,
      invalidTokens: failedTokens.length,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Send push notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Send results
 */
export const sendBulkPushNotification = async (userIds, notification) => {
  try {
    const results = await Promise.allSettled(
      userIds.map(userId => sendPushNotification(userId, notification))
    );

    const summary = {
      totalUsers: userIds.length,
      successfulUsers: 0,
      failedUsers: 0,
      totalNotificationsSent: 0,
    };

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        summary.successfulUsers++;
        summary.totalNotificationsSent += result.value.successCount;
      } else {
        summary.failedUsers++;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
    throw error;
  }
};

/**
 * Register FCM token for a user
 * @param {string} userId - User ID
 * @param {string} token - FCM token
 * @param {string} deviceType - Device type (web, android, ios)
 * @returns {Promise<void>}
 */
export const registerFCMToken = async (userId, token, deviceType = 'web') => {
  try {
    // Check if token already exists
    const existingTokenSnapshot = await db.collection('fcmTokens')
      .where('token', '==', token)
      .get();

    if (!existingTokenSnapshot.empty) {
      // Update existing token
      const doc = existingTokenSnapshot.docs[0];
      await doc.ref.update({
        userId,
        active: true,
        deviceType,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new token record
      await db.collection('fcmTokens').add({
        userId,
        token,
        deviceType,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`FCM token registered for user ${userId}`);
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
};

/**
 * Unregister FCM token
 * @param {string} token - FCM token to unregister
 * @returns {Promise<void>}
 */
export const unregisterFCMToken = async (token) => {
  try {
    const snapshot = await db.collection('fcmTokens')
      .where('token', '==', token)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { active: false });
    });

    await batch.commit();
    console.log(`FCM token unregistered: ${token}`);
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    throw error;
  }
};

/**
 * Remove invalid FCM tokens
 * @param {Array} tokens - Array of invalid tokens
 * @returns {Promise<void>}
 */
const removeInvalidTokens = async (tokens) => {
  try {
    const batch = db.batch();

    for (const token of tokens) {
      const snapshot = await db.collection('fcmTokens')
        .where('token', '==', token)
        .get();

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
    console.log(`Removed ${tokens.length} invalid FCM tokens`);
  } catch (error) {
    console.error('Error removing invalid tokens:', error);
  }
};

/**
 * Get user's active FCM tokens
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active tokens
 */
export const getUserFCMTokens = async (userId) => {
  try {
    const snapshot = await db.collection('fcmTokens')
      .where('userId', '==', userId)
      .where('active', '==', true)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      tokens.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return tokens;
  } catch (error) {
    console.error('Error getting user FCM tokens:', error);
    throw error;
  }
};

/**
 * Send topic-based notification
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Send result
 */
export const sendTopicNotification = async (topic, notification) => {
  try {
    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        priority: notification.priority,
        createdAt: new Date().toISOString(),
      },
    };

    const result = await messaging.send(message);
    console.log(`Topic notification sent to ${topic}:`, result);

    return { success: true, messageId: result };
  } catch (error) {
    console.error('Error sending topic notification:', error);
    throw error;
  }
};

/**
 * Subscribe user to topic
 * @param {string} userId - User ID
 * @param {string} topic - Topic name
 * @returns {Promise<void>}
 */
export const subscribeToTopic = async (userId, topic) => {
  try {
    const tokens = await getUserFCMTokens(userId);
    const tokenStrings = tokens.map(t => t.token);

    if (tokenStrings.length > 0) {
      await messaging.subscribeToTopic(tokenStrings, topic);
      console.log(`User ${userId} subscribed to topic ${topic}`);
    }
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
};

/**
 * Unsubscribe user from topic
 * @param {string} userId - User ID
 * @param {string} topic - Topic name
 * @returns {Promise<void>}
 */
export const unsubscribeFromTopic = async (userId, topic) => {
  try {
    const tokens = await getUserFCMTokens(userId);
    const tokenStrings = tokens.map(t => t.token);

    if (tokenStrings.length > 0) {
      await messaging.unsubscribeFromTopic(tokenStrings, topic);
      console.log(`User ${userId} unsubscribed from topic ${topic}`);
    }
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw error;
  }
};