import { getFirestore } from '../config/firebase.js';
import { createNotification } from './notificationController.js';

const db = getFirestore();

// Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Remove sensitive information
    const { password, ...publicUserData } = userData;

    res.json({
      success: true,
      data: {
        id: uid,
        ...publicUserData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const updateData = req.body;

    const now = new Date().toISOString();
    const finalUpdateData = {
      ...updateData,
      updatedAt: now,
    };

    // Remove undefined values
    Object.keys(finalUpdateData).forEach(key => {
      if (finalUpdateData[key] === undefined) {
        delete finalUpdateData[key];
      }
    });

    await db.collection('users').doc(uid).update(finalUpdateData);

    // Get updated user data
    const updatedDoc = await db.collection('users').doc(uid).get();
    const userData = updatedDoc.data();
    const { password, ...publicUserData } = userData;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: uid,
        ...publicUserData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (req, res, next) => {
  try {
    const { uid } = req.user;

    // Get user's testnets
    const testnetsQuery = await db.collection('testnets')
      .where('participants', 'array-contains', uid)
      .get();

    const completedTestnetsQuery = await db.collection('testnets')
      .where('participants', 'array-contains', uid)
      .where('status', '==', 'completed')
      .get();

    // Get user's created testnets
    const createdTestnetsQuery = await db.collection('testnets')
      .where('createdBy', '==', uid)
      .get();

    // Get user's faucets
    const faucetsQuery = await db.collection('faucets')
      .where('createdBy', '==', uid)
      .get();

    // Get user's ratings
    const ratingsQuery = await db.collection('faucetRatings')
      .where('userId', '==', uid)
      .get();

    // Get followers/following counts
    const followersQuery = await db.collection('userFollows')
      .where('followingId', '==', uid)
      .get();

    const followingQuery = await db.collection('userFollows')
      .where('followerId', '==', uid)
      .get();

    // Calculate statistics
    const stats = {
      testnets: {
        participated: testnetsQuery.size,
        completed: completedTestnetsQuery.size,
        created: createdTestnetsQuery.size,
        completionRate: testnetsQuery.size > 0 
          ? Math.round((completedTestnetsQuery.size / testnetsQuery.size) * 100) 
          : 0,
      },
      faucets: {
        created: faucetsQuery.size,
        totalRatings: ratingsQuery.size,
      },
      social: {
        followers: followersQuery.size,
        following: followingQuery.size,
      },
    };

    // Calculate user level based on activity
    const totalActivity = stats.testnets.completed + stats.faucets.created + stats.faucets.totalRatings;
    let level = 1;
    let nextLevelThreshold = 10;

    if (totalActivity >= 100) level = 5;
    else if (totalActivity >= 50) level = 4;
    else if (totalActivity >= 25) level = 3;
    else if (totalActivity >= 10) level = 2;

    if (level < 5) {
      const thresholds = [0, 10, 25, 50, 100];
      nextLevelThreshold = thresholds[level];
    }

    stats.level = {
      current: level,
      progress: totalActivity,
      nextLevelThreshold: level < 5 ? nextLevelThreshold : null,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get user activity
export const getUserActivity = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const {
      page = 1,
      limit = 20,
      type,
    } = req.query;

    const activities = [];

    // Get testnet activities
    if (!type || type === 'testnet') {
      const testnetsQuery = await db.collection('testnets')
        .where('participants', 'array-contains', uid)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();

      testnetsQuery.forEach(doc => {
        const testnet = doc.data();
        activities.push({
          id: doc.id,
          type: 'testnet_joined',
          title: `Joined testnet: ${testnet.name}`,
          description: testnet.description,
          timestamp: testnet.createdAt,
          data: {
            testnetId: doc.id,
            testnetName: testnet.name,
          },
        });
      });
    }

    // Get faucet activities
    if (!type || type === 'faucet') {
      const faucetsQuery = await db.collection('faucets')
        .where('createdBy', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();

      faucetsQuery.forEach(doc => {
        const faucet = doc.data();
        activities.push({
          id: doc.id,
          type: 'faucet_created',
          title: `Created faucet: ${faucet.name}`,
          description: faucet.description,
          timestamp: faucet.createdAt,
          data: {
            faucetId: doc.id,
            faucetName: faucet.name,
            network: faucet.network,
          },
        });
      });
    }

    // Get rating activities
    if (!type || type === 'rating') {
      const ratingsQuery = await db.collection('faucetRatings')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();

      for (const ratingDoc of ratingsQuery.docs) {
        const rating = ratingDoc.data();
        const faucetDoc = await db.collection('faucets').doc(rating.faucetId).get();
        
        if (faucetDoc.exists) {
          const faucet = faucetDoc.data();
          activities.push({
            id: ratingDoc.id,
            type: 'faucet_rated',
            title: `Rated faucet: ${faucet.name}`,
            description: `Gave ${rating.rating} stars`,
            timestamp: rating.createdAt,
            data: {
              faucetId: rating.faucetId,
              faucetName: faucet.name,
              rating: rating.rating,
            },
          });
        }
      }
    }

    // Sort activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedActivities = activities.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activities.length / parseInt(limit)),
          totalCount: activities.length,
          hasNextPage: endIndex < activities.length,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search users
export const searchUsers = async (req, res, next) => {
  try {
    const {
      search,
      page = 1,
      limit = 20,
    } = req.query;

    if (!search) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    // Get all users (Firestore doesn't support text search natively)
    const usersQuery = await db.collection('users').get();
    let users = [];

    usersQuery.forEach(doc => {
      const userData = doc.data();
      const { password, ...publicUserData } = userData;
      
      users.push({
        id: doc.id,
        ...publicUserData,
      });
    });

    // Client-side search filtering
    const searchLower = search.toLowerCase();
    users = users.filter(user => {
      const nameMatch = user.displayName?.toLowerCase().includes(searchLower);
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      const bioMatch = user.bio?.toLowerCase().includes(searchLower);
      
      return nameMatch || emailMatch || bioMatch;
    });

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.length / parseInt(limit)),
          totalCount: users.length,
          hasNextPage: endIndex < users.length,
          hasPrevPage: parseInt(page) > 1,
        },
        searchQuery: search,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Follow user
export const followUser = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id: targetUserId } = req.params;

    if (uid === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot follow yourself',
      });
    }

    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if already following
    const existingFollowQuery = await db.collection('userFollows')
      .where('followerId', '==', uid)
      .where('followingId', '==', targetUserId)
      .get();

    if (!existingFollowQuery.empty) {
      return res.status(400).json({
        success: false,
        error: 'Already following this user',
      });
    }

    // Create follow relationship
    const now = new Date().toISOString();
    await db.collection('userFollows').add({
      followerId: uid,
      followingId: targetUserId,
      createdAt: now,
    });

    // Create notification for the followed user
    const followerDoc = await db.collection('users').doc(uid).get();
    const followerData = followerDoc.data();

    await createNotification(targetUserId, {
      type: 'social',
      title: 'New Follower',
      message: `${followerData.displayName || followerData.email} started following you`,
      priority: 'low',
      data: {
        followerId: uid,
        followerName: followerData.displayName || followerData.email,
      },
    });

    res.json({
      success: true,
      message: 'User followed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Unfollow user
export const unfollowUser = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id: targetUserId } = req.params;

    // Find and delete follow relationship
    const followQuery = await db.collection('userFollows')
      .where('followerId', '==', uid)
      .where('followingId', '==', targetUserId)
      .get();

    if (followQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'Follow relationship not found',
      });
    }

    // Delete the follow relationship
    const batch = db.batch();
    followQuery.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({
      success: true,
      message: 'User unfollowed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get followers
export const getFollowers = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const {
      page = 1,
      limit = 20,
    } = req.query;

    // Get followers
    const followersQuery = await db.collection('userFollows')
      .where('followingId', '==', userId)
      .orderBy('createdAt', 'desc')
      .offset((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .get();

    const followers = [];
    
    for (const doc of followersQuery.docs) {
      const followData = doc.data();
      const userDoc = await db.collection('users').doc(followData.followerId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const { password, ...publicUserData } = userData;
        
        followers.push({
          id: userDoc.id,
          ...publicUserData,
          followedAt: followData.createdAt,
        });
      }
    }

    // Get total count
    const totalQuery = await db.collection('userFollows')
      .where('followingId', '==', userId)
      .get();

    res.json({
      success: true,
      data: {
        followers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalQuery.size / parseInt(limit)),
          totalCount: totalQuery.size,
          hasNextPage: parseInt(page) * parseInt(limit) < totalQuery.size,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get following
export const getFollowing = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const {
      page = 1,
      limit = 20,
    } = req.query;

    // Get following
    const followingQuery = await db.collection('userFollows')
      .where('followerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .offset((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .get();

    const following = [];
    
    for (const doc of followingQuery.docs) {
      const followData = doc.data();
      const userDoc = await db.collection('users').doc(followData.followingId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const { password, ...publicUserData } = userData;
        
        following.push({
          id: userDoc.id,
          ...publicUserData,
          followedAt: followData.createdAt,
        });
      }
    }

    // Get total count
    const totalQuery = await db.collection('userFollows')
      .where('followerId', '==', userId)
      .get();

    res.json({
      success: true,
      data: {
        following,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalQuery.size / parseInt(limit)),
          totalCount: totalQuery.size,
          hasNextPage: parseInt(page) * parseInt(limit) < totalQuery.size,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Block user
export const blockUser = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id: targetUserId } = req.params;

    if (uid === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot block yourself',
      });
    }

    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if already blocked
    const existingBlockQuery = await db.collection('userBlocks')
      .where('blockerId', '==', uid)
      .where('blockedId', '==', targetUserId)
      .get();

    if (!existingBlockQuery.empty) {
      return res.status(400).json({
        success: false,
        error: 'User already blocked',
      });
    }

    // Create block relationship
    const now = new Date().toISOString();
    await db.collection('userBlocks').add({
      blockerId: uid,
      blockedId: targetUserId,
      createdAt: now,
    });

    // Remove any existing follow relationships
    const followQuery1 = await db.collection('userFollows')
      .where('followerId', '==', uid)
      .where('followingId', '==', targetUserId)
      .get();

    const followQuery2 = await db.collection('userFollows')
      .where('followerId', '==', targetUserId)
      .where('followingId', '==', uid)
      .get();

    const batch = db.batch();
    followQuery1.forEach(doc => batch.delete(doc.ref));
    followQuery2.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Unblock user
export const unblockUser = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id: targetUserId } = req.params;

    // Find and delete block relationship
    const blockQuery = await db.collection('userBlocks')
      .where('blockerId', '==', uid)
      .where('blockedId', '==', targetUserId)
      .get();

    if (blockQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'Block relationship not found',
      });
    }

    // Delete the block relationship
    const batch = db.batch();
    blockQuery.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Report user
export const reportUser = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id: targetUserId } = req.params;
    const { reason, description } = req.body;

    if (uid === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot report yourself',
      });
    }

    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const now = new Date().toISOString();
    const reportData = {
      reporterId: uid,
      reportedId: targetUserId,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: now,
    };

    await db.collection('userReports').add(reportData);

    // Notify admins about the report
    const adminQuery = await db.collection('users').where('role', '==', 'admin').get();
    const adminPromises = [];
    const targetUserData = targetUserDoc.data();
    
    adminQuery.forEach(adminDoc => {
      adminPromises.push(
        createNotification(adminDoc.id, {
          type: 'system',
          title: 'User Reported',
          message: `User "${targetUserData.displayName || targetUserData.email}" has been reported for: ${reason}`,
          priority: 'high',
          data: {
            reportedUserId: targetUserId,
            reportedUserName: targetUserData.displayName || targetUserData.email,
            reason,
          },
        })
      );
    });

    await Promise.all(adminPromises);

    res.json({
      success: true,
      message: 'User reported successfully',
    });
  } catch (error) {
    next(error);
  }
};