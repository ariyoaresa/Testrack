import { getFirestore } from '../config/firebase.js';
import { calculateNextDeadline, formatTimeRemaining } from '../utils/dateUtils.js';

const db = getFirestore();

// Create new testnet
export const createTestnet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const {
      name,
      description,
      websiteUrl,
      logoUrl,
      walletAddress,
      participationInterval,
      customInterval,
      deadlineType,
      reminderTime,
      category,
      blockchain,
    } = req.body;

    const now = new Date();
    const nextDeadline = calculateNextDeadline(deadlineType, participationInterval, customInterval);

    const testnetData = {
      userId: uid,
      name,
      description: description || '',
      websiteUrl: websiteUrl || '',
      logoUrl: logoUrl || '',
      walletAddress,
      participationInterval,
      customInterval: customInterval || null,
      deadlineType,
      reminderTime: reminderTime || 12,
      category: category || 'other',
      blockchain,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      nextDeadline: nextDeadline.toISOString(),
      lastCompletedAt: null,
      completionCount: 0,
      missedCount: 0,
      isActive: true,
    };

    const docRef = await db.collection('testnets').add(testnetData);

    // Update user stats
    await db.collection('users').doc(uid).update({
      'stats.totalTestnets': db.FieldValue.increment(1),
      updatedAt: now.toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Testnet created successfully',
      data: {
        id: docRef.id,
        ...testnetData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's testnets with filtering and pagination
export const getTestnets = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const {
      page = 1,
      limit = 20,
      status,
      category,
      blockchain,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    let query = db.collection('testnets').where('userId', '==', uid);

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    if (blockchain) {
      query = query.where('blockchain', '==', blockchain);
    }

    // Apply sorting
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, sortDirection);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const testnets = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      testnets.push({
        id: doc.id,
        ...data,
        timeRemaining: formatTimeRemaining(new Date(data.nextDeadline)),
      });
    });

    // Filter by search term if provided (client-side filtering for simplicity)
    let filteredTestnets = testnets;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredTestnets = testnets.filter(testnet =>
        testnet.name.toLowerCase().includes(searchTerm) ||
        testnet.blockchain.toLowerCase().includes(searchTerm) ||
        testnet.description.toLowerCase().includes(searchTerm)
      );
    }

    // Get total count for pagination
    const countQuery = db.collection('testnets').where('userId', '==', uid);
    const countSnapshot = await countQuery.get();
    const totalCount = countSnapshot.size;

    res.json({
      success: true,
      data: {
        testnets: filteredTestnets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: parseInt(page) * parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single testnet
export const getTestnet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const doc = await db.collection('testnets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Testnet not found',
      });
    }

    const testnetData = doc.data();

    // Check if user owns this testnet
    if (testnetData.userId !== uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...testnetData,
        timeRemaining: formatTimeRemaining(new Date(testnetData.nextDeadline)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update testnet
export const updateTestnet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Get existing testnet
    const doc = await db.collection('testnets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Testnet not found',
      });
    }

    const existingData = doc.data();

    // Check if user owns this testnet
    if (existingData.userId !== uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Prepare update data
    const now = new Date();
    const finalUpdateData = {
      ...updateData,
      updatedAt: now.toISOString(),
    };

    // Recalculate next deadline if interval settings changed
    if (updateData.participationInterval || updateData.customInterval || updateData.deadlineType) {
      const nextDeadline = calculateNextDeadline(
        updateData.deadlineType || existingData.deadlineType,
        updateData.participationInterval || existingData.participationInterval,
        updateData.customInterval || existingData.customInterval
      );
      finalUpdateData.nextDeadline = nextDeadline.toISOString();
    }

    await db.collection('testnets').doc(id).update(finalUpdateData);

    // Get updated document
    const updatedDoc = await db.collection('testnets').doc(id).get();
    const updatedData = updatedDoc.data();

    res.json({
      success: true,
      message: 'Testnet updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedData,
        timeRemaining: formatTimeRemaining(new Date(updatedData.nextDeadline)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete testnet
export const deleteTestnet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Get testnet to verify ownership
    const doc = await db.collection('testnets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Testnet not found',
      });
    }

    const testnetData = doc.data();

    // Check if user owns this testnet
    if (testnetData.userId !== uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Delete testnet
    await db.collection('testnets').doc(id).delete();

    // Update user stats
    await db.collection('users').doc(uid).update({
      'stats.totalTestnets': db.FieldValue.increment(-1),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Testnet deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Mark testnet as complete
export const markTestnetComplete = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Get testnet
    const doc = await db.collection('testnets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Testnet not found',
      });
    }

    const testnetData = doc.data();

    // Check if user owns this testnet
    if (testnetData.userId !== uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const now = new Date();
    const nextDeadline = calculateNextDeadline(
      testnetData.deadlineType,
      testnetData.participationInterval,
      testnetData.customInterval
    );

    // Update testnet
    await db.collection('testnets').doc(id).update({
      lastCompletedAt: now.toISOString(),
      nextDeadline: nextDeadline.toISOString(),
      completionCount: db.FieldValue.increment(1),
      status: 'active',
      updatedAt: now.toISOString(),
    });

    // Update user stats
    await db.collection('users').doc(uid).update({
      'stats.completedTestnets': db.FieldValue.increment(1),
      updatedAt: now.toISOString(),
    });

    res.json({
      success: true,
      message: 'Testnet marked as complete',
      data: {
        nextDeadline: nextDeadline.toISOString(),
        timeRemaining: formatTimeRemaining(nextDeadline),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get testnet statistics
export const getTestnetStats = async (req, res, next) => {
  try {
    const { uid } = req.user;

    const snapshot = await db.collection('testnets')
      .where('userId', '==', uid)
      .get();

    const stats = {
      total: 0,
      active: 0,
      completed: 0,
      missed: 0,
      paused: 0,
      totalCompletions: 0,
      totalMissed: 0,
      blockchains: {},
      categories: {},
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;
      stats[data.status]++;
      stats.totalCompletions += data.completionCount || 0;
      stats.totalMissed += data.missedCount || 0;

      // Count by blockchain
      stats.blockchains[data.blockchain] = (stats.blockchains[data.blockchain] || 0) + 1;

      // Count by category
      stats.categories[data.category] = (stats.categories[data.category] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get upcoming deadlines
export const getUpcomingDeadlines = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { hours = 24 } = req.query;

    const now = new Date();
    const futureTime = new Date(now.getTime() + parseInt(hours) * 60 * 60 * 1000);

    const snapshot = await db.collection('testnets')
      .where('userId', '==', uid)
      .where('status', '==', 'active')
      .where('nextDeadline', '<=', futureTime.toISOString())
      .orderBy('nextDeadline', 'asc')
      .get();

    const upcomingDeadlines = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const deadline = new Date(data.nextDeadline);
      
      if (deadline > now) {
        upcomingDeadlines.push({
          id: doc.id,
          name: data.name,
          blockchain: data.blockchain,
          nextDeadline: data.nextDeadline,
          timeRemaining: formatTimeRemaining(deadline),
          urgency: deadline.getTime() - now.getTime() < 3600000 ? 'critical' : 'warning', // 1 hour
        });
      }
    });

    res.json({
      success: true,
      data: upcomingDeadlines,
    });
  } catch (error) {
    next(error);
  }
};