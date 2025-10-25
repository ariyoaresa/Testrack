import cron from 'node-cron';
import { getFirestore } from '../config/firebase.js';
import { createNotification } from '../controllers/notificationController.js';
import { calculateReminderTime, isOverdue, getUrgencyLevel } from '../utils/dateUtils.js';

const db = getFirestore();

/**
 * Start the notification scheduler
 */
export const startNotificationScheduler = () => {
  console.log('Starting notification scheduler...');

  // Check for deadline reminders every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await checkDeadlineReminders();
    } catch (error) {
      console.error('Error in deadline reminder check:', error);
    }
  });

  // Check for overdue testnets every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await checkOverdueTestnets();
    } catch (error) {
      console.error('Error in overdue testnet check:', error);
    }
  });

  // Daily summary at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      await sendDailySummary();
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  });

  // Weekly summary on Sundays at 10 AM
  cron.schedule('0 10 * * 0', async () => {
    try {
      await sendWeeklySummary();
    } catch (error) {
      console.error('Error sending weekly summary:', error);
    }
  });

  console.log('Notification scheduler started successfully');
};

/**
 * Check for upcoming deadlines and send reminders
 */
const checkDeadlineReminders = async () => {
  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

    // Get all active testnets with upcoming deadlines
    const testnetsSnapshot = await db.collection('testnets')
      .where('status', '==', 'active')
      .where('nextDeadline', '<=', futureTime.toISOString())
      .get();

    const reminderPromises = [];

    testnetsSnapshot.forEach(async (doc) => {
      const testnet = { id: doc.id, ...doc.data() };
      const deadline = new Date(testnet.nextDeadline);
      
      // Skip if deadline has passed
      if (deadline <= now) return;

      // Get user's notification settings
      const settingsDoc = await db.collection('notificationSettings').doc(testnet.userId).get();
      const settings = settingsDoc.exists ? settingsDoc.data() : { deadlineReminders: true, reminderTime: 12 };

      if (!settings.deadlineReminders) return;

      const reminderTime = calculateReminderTime(deadline, settings.reminderTime || 12);
      
      // Check if it's time to send reminder
      if (now >= reminderTime && now < deadline) {
        // Check if reminder was already sent
        const existingReminderSnapshot = await db.collection('notifications')
          .where('userId', '==', testnet.userId)
          .where('type', '==', 'reminder')
          .where('testnetId', '==', testnet.id)
          .where('createdAt', '>=', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .get();

        if (existingReminderSnapshot.empty) {
          const urgency = getUrgencyLevel(deadline);
          const timeRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

          reminderPromises.push(
            createNotification(testnet.userId, {
              type: 'reminder',
              title: `Testnet Deadline Reminder: ${testnet.name}`,
              message: `Your testnet "${testnet.name}" on ${testnet.blockchain} has a deadline in ${timeRemaining} hour(s).`,
              priority: urgency === 'critical' ? 'high' : 'medium',
              testnetId: testnet.id,
              metadata: {
                testnetName: testnet.name,
                blockchain: testnet.blockchain,
                deadline: testnet.nextDeadline,
                timeRemaining: `${timeRemaining}h`,
              },
            })
          );
        }
      }
    });

    await Promise.all(reminderPromises);
    console.log(`Processed ${reminderPromises.length} deadline reminders`);
  } catch (error) {
    console.error('Error checking deadline reminders:', error);
  }
};

/**
 * Check for overdue testnets and send notifications
 */
const checkOverdueTestnets = async () => {
  try {
    const now = new Date();

    // Get all active testnets that are overdue
    const testnetsSnapshot = await db.collection('testnets')
      .where('status', '==', 'active')
      .where('nextDeadline', '<', now.toISOString())
      .get();

    const overduePromises = [];

    testnetsSnapshot.forEach(async (doc) => {
      const testnet = { id: doc.id, ...doc.data() };
      const deadline = new Date(testnet.nextDeadline);
      
      // Check if overdue notification was already sent in the last 24 hours
      const existingOverdueSnapshot = await db.collection('notifications')
        .where('userId', '==', testnet.userId)
        .where('type', '==', 'deadline')
        .where('testnetId', '==', testnet.id)
        .where('createdAt', '>=', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .get();

      if (existingOverdueSnapshot.empty) {
        const hoursOverdue = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60));

        overduePromises.push(
          createNotification(testnet.userId, {
            type: 'deadline',
            title: `Overdue: ${testnet.name}`,
            message: `Your testnet "${testnet.name}" on ${testnet.blockchain} is ${hoursOverdue} hour(s) overdue. Don't forget to complete your participation!`,
            priority: 'high',
            testnetId: testnet.id,
            metadata: {
              testnetName: testnet.name,
              blockchain: testnet.blockchain,
              deadline: testnet.nextDeadline,
              hoursOverdue,
            },
          })
        );

        // Update testnet status to overdue if significantly overdue (>24 hours)
        if (hoursOverdue > 24) {
          await db.collection('testnets').doc(testnet.id).update({
            status: 'overdue',
            missedCount: db.FieldValue.increment(1),
            updatedAt: now.toISOString(),
          });

          // Update user stats
          await db.collection('users').doc(testnet.userId).update({
            'stats.missedDeadlines': db.FieldValue.increment(1),
            updatedAt: now.toISOString(),
          });
        }
      }
    });

    await Promise.all(overduePromises);
    console.log(`Processed ${overduePromises.length} overdue notifications`);
  } catch (error) {
    console.error('Error checking overdue testnets:', error);
  }
};

/**
 * Send daily summary to users
 */
const sendDailySummary = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get all users who have testnets with deadlines today
    const testnetsSnapshot = await db.collection('testnets')
      .where('status', '==', 'active')
      .where('nextDeadline', '>=', now.toISOString())
      .where('nextDeadline', '<', tomorrow.toISOString())
      .get();

    const userSummaries = {};

    testnetsSnapshot.forEach((doc) => {
      const testnet = { id: doc.id, ...doc.data() };
      
      if (!userSummaries[testnet.userId]) {
        userSummaries[testnet.userId] = [];
      }
      
      userSummaries[testnet.userId].push(testnet);
    });

    const summaryPromises = Object.entries(userSummaries).map(async ([userId, testnets]) => {
      // Check if user wants daily summaries
      const settingsDoc = await db.collection('notificationSettings').doc(userId).get();
      const settings = settingsDoc.exists ? settingsDoc.data() : {};
      
      if (settings.notificationTypes?.system === false) return;

      const testnetNames = testnets.map(t => t.name).join(', ');
      
      return createNotification(userId, {
        type: 'system',
        title: 'Daily Testnet Summary',
        message: `You have ${testnets.length} testnet deadline(s) today: ${testnetNames}`,
        priority: 'medium',
        metadata: {
          summaryType: 'daily',
          testnetCount: testnets.length,
          testnets: testnets.map(t => ({
            id: t.id,
            name: t.name,
            blockchain: t.blockchain,
            deadline: t.nextDeadline,
          })),
        },
      });
    });

    await Promise.all(summaryPromises);
    console.log(`Sent daily summaries to ${Object.keys(userSummaries).length} users`);
  } catch (error) {
    console.error('Error sending daily summaries:', error);
  }
};

/**
 * Send weekly summary to users
 */
const sendWeeklySummary = async () => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    const summaryPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Check if user wants weekly summaries
      const settingsDoc = await db.collection('notificationSettings').doc(userId).get();
      const settings = settingsDoc.exists ? settingsDoc.data() : {};
      
      if (settings.notificationTypes?.system === false) return;

      // Get user's testnet activity for the week
      const testnetsSnapshot = await db.collection('testnets')
        .where('userId', '==', userId)
        .get();

      let completedThisWeek = 0;
      let missedThisWeek = 0;
      let totalActive = 0;

      testnetsSnapshot.forEach((doc) => {
        const testnet = doc.data();
        
        if (testnet.status === 'active') {
          totalActive++;
        }

        if (testnet.lastCompletedAt && new Date(testnet.lastCompletedAt) >= weekAgo) {
          completedThisWeek++;
        }

        // Count missed deadlines this week (simplified)
        if (testnet.updatedAt && new Date(testnet.updatedAt) >= weekAgo && testnet.status === 'overdue') {
          missedThisWeek++;
        }
      });

      if (totalActive === 0) return; // Skip users with no active testnets

      return createNotification(userId, {
        type: 'system',
        title: 'Weekly Testnet Summary',
        message: `This week: ${completedThisWeek} completed, ${missedThisWeek} missed. You have ${totalActive} active testnets.`,
        priority: 'low',
        metadata: {
          summaryType: 'weekly',
          completedThisWeek,
          missedThisWeek,
          totalActive,
          weekStart: weekAgo.toISOString(),
          weekEnd: now.toISOString(),
        },
      });
    });

    await Promise.all(summaryPromises.filter(Boolean));
    console.log(`Sent weekly summaries to users`);
  } catch (error) {
    console.error('Error sending weekly summaries:', error);
  }
};

/**
 * Send custom notification to user
 * @param {string} userId - User ID
 * @param {Object} notificationData - Notification data
 */
export const scheduleCustomNotification = async (userId, notificationData) => {
  try {
    await createNotification(userId, notificationData);
    console.log(`Custom notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw error;
  }
};

/**
 * Stop the notification scheduler
 */
export const stopNotificationScheduler = () => {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log('Notification scheduler stopped');
};