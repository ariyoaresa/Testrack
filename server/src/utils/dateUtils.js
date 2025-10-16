/**
 * Calculate the next deadline based on participation interval and deadline type
 * @param {string} deadlineType - 'fixed' or 'rolling'
 * @param {string} participationInterval - 'daily', 'weekly', 'monthly', 'custom'
 * @param {number} customInterval - Custom interval in hours (for custom interval type)
 * @param {Date} lastCompletedAt - Last completion date (for rolling deadlines)
 * @returns {Date} Next deadline
 */
export const calculateNextDeadline = (deadlineType, participationInterval, customInterval, lastCompletedAt = null) => {
  const now = new Date();
  const baseDate = deadlineType === 'rolling' && lastCompletedAt ? new Date(lastCompletedAt) : now;
  
  let nextDeadline = new Date(baseDate);

  switch (participationInterval) {
    case 'daily':
      nextDeadline.setDate(nextDeadline.getDate() + 1);
      break;
    case 'weekly':
      nextDeadline.setDate(nextDeadline.getDate() + 7);
      break;
    case 'monthly':
      nextDeadline.setMonth(nextDeadline.getMonth() + 1);
      break;
    case 'custom':
      if (customInterval && customInterval > 0) {
        nextDeadline.setHours(nextDeadline.getHours() + customInterval);
      } else {
        // Default to 24 hours if custom interval is invalid
        nextDeadline.setDate(nextDeadline.getDate() + 1);
      }
      break;
    default:
      // Default to daily
      nextDeadline.setDate(nextDeadline.getDate() + 1);
  }

  return nextDeadline;
};

/**
 * Format time remaining until a deadline
 * @param {Date} deadline - The deadline date
 * @returns {string} Formatted time remaining
 */
export const formatTimeRemaining = (deadline) => {
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return 'Overdue';
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Check if a deadline is overdue
 * @param {Date} deadline - The deadline date
 * @returns {boolean} True if overdue
 */
export const isOverdue = (deadline) => {
  const now = new Date();
  return deadline.getTime() < now.getTime();
};

/**
 * Get deadlines within a specific time range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} testnets - Array of testnet objects
 * @returns {Array} Filtered testnets with deadlines in range
 */
export const getDeadlinesInRange = (startDate, endDate, testnets) => {
  return testnets.filter(testnet => {
    const deadline = new Date(testnet.nextDeadline);
    return deadline >= startDate && deadline <= endDate;
  });
};

/**
 * Calculate reminder time before deadline
 * @param {Date} deadline - The deadline date
 * @param {number} reminderHours - Hours before deadline to remind
 * @returns {Date} Reminder time
 */
export const calculateReminderTime = (deadline, reminderHours = 12) => {
  const reminderTime = new Date(deadline);
  reminderTime.setHours(reminderTime.getHours() - reminderHours);
  return reminderTime;
};

/**
 * Get urgency level based on time remaining
 * @param {Date} deadline - The deadline date
 * @returns {string} Urgency level: 'low', 'medium', 'high', 'critical'
 */
export const getUrgencyLevel = (deadline) => {
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  const hoursRemaining = timeDiff / (1000 * 60 * 60);

  if (hoursRemaining <= 0) {
    return 'overdue';
  } else if (hoursRemaining <= 1) {
    return 'critical';
  } else if (hoursRemaining <= 6) {
    return 'high';
  } else if (hoursRemaining <= 24) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  const options = {
    short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    },
    time: { hour: '2-digit', minute: '2-digit' },
  };

  return date.toLocaleDateString('en-US', options[format] || options.short);
};

/**
 * Get next occurrence of a specific time (for daily reminders)
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {Date} Next occurrence of the specified time
 */
export const getNextOccurrence = (hour, minute) => {
  const now = new Date();
  const next = new Date();
  
  next.setHours(hour, minute, 0, 0);
  
  // If the time has already passed today, set it for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
};