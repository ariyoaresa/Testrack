import { getFirestore } from '../config/firebase.js';
import { createNotification } from './notificationController.js';

const db = getFirestore();

// Get all faucets with filtering and pagination
export const getFaucets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      network,
      tags,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    let query = db.collection('faucets');

    // Apply filters
    if (network) {
      query = query.where('network', '==', network);
    }

    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      query = query.where('tags', 'array-contains-any', tagArray);
    }

    // Apply sorting
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, sortDirection);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    let faucets = [];

    snapshot.forEach(doc => {
      const faucetData = doc.data();
      faucets.push({
        id: doc.id,
        ...faucetData,
      });
    });

    // Apply text search if provided (client-side filtering for Firestore)
    if (search) {
      const searchLower = search.toLowerCase();
      faucets = faucets.filter(faucet => 
        faucet.name.toLowerCase().includes(searchLower) ||
        faucet.description?.toLowerCase().includes(searchLower) ||
        faucet.network.toLowerCase().includes(searchLower) ||
        faucet.tokenSymbol?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count for pagination
    const countQuery = db.collection('faucets');
    const countSnapshot = await countQuery.get();
    const totalCount = countSnapshot.size;

    // Add user favorites if authenticated
    if (req.user) {
      const favoritesDoc = await db.collection('userFavorites').doc(req.user.uid).get();
      const favorites = favoritesDoc.exists ? favoritesDoc.data().faucets || [] : [];
      
      faucets = faucets.map(faucet => ({
        ...faucet,
        isFavorite: favorites.includes(faucet.id),
      }));
    }

    res.json({
      success: true,
      data: {
        faucets,
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

// Get faucet by ID
export const getFaucetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('faucets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Faucet not found',
      });
    }

    let faucetData = {
      id: doc.id,
      ...doc.data(),
    };

    // Add user favorite status if authenticated
    if (req.user) {
      const favoritesDoc = await db.collection('userFavorites').doc(req.user.uid).get();
      const favorites = favoritesDoc.exists ? favoritesDoc.data().faucets || [] : [];
      faucetData.isFavorite = favorites.includes(id);
    }

    // Increment view count
    await db.collection('faucets').doc(id).update({
      viewCount: (faucetData.viewCount || 0) + 1,
    });

    res.json({
      success: true,
      data: faucetData,
    });
  } catch (error) {
    next(error);
  }
};

// Create new faucet
export const createFaucet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const faucetData = req.body;

    const now = new Date().toISOString();
    const newFaucet = {
      ...faucetData,
      createdBy: uid,
      createdAt: now,
      updatedAt: now,
      isActive: faucetData.isActive !== undefined ? faucetData.isActive : true,
      isVerified: false,
      rating: 0,
      ratingCount: 0,
      usageCount: 0,
      viewCount: 0,
      reportCount: 0,
      tags: faucetData.tags || [],
      requirements: faucetData.requirements || [],
    };

    const docRef = await db.collection('faucets').add(newFaucet);

    // Create notification for admins about new faucet submission
    const adminQuery = await db.collection('users').where('role', '==', 'admin').get();
    const adminPromises = [];
    
    adminQuery.forEach(adminDoc => {
      adminPromises.push(
        createNotification(adminDoc.id, {
          type: 'system',
          title: 'New Faucet Submission',
          message: `A new faucet "${faucetData.name}" has been submitted for review.`,
          priority: 'medium',
          data: {
            faucetId: docRef.id,
            faucetName: faucetData.name,
          },
        })
      );
    });

    await Promise.all(adminPromises);

    res.status(201).json({
      success: true,
      message: 'Faucet created successfully',
      data: {
        id: docRef.id,
        ...newFaucet,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update faucet
export const updateFaucet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Get faucet to verify ownership or admin privileges
    const doc = await db.collection('faucets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Faucet not found',
      });
    }

    const faucetData = doc.data();

    // Check if user owns this faucet or is admin
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin';

    if (faucetData.createdBy !== uid && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

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

    await db.collection('faucets').doc(id).update(finalUpdateData);

    // Get updated faucet
    const updatedDoc = await db.collection('faucets').doc(id).get();
    const updatedFaucet = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };

    res.json({
      success: true,
      message: 'Faucet updated successfully',
      data: updatedFaucet,
    });
  } catch (error) {
    next(error);
  }
};

// Delete faucet
export const deleteFaucet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Get faucet to verify ownership or admin privileges
    const doc = await db.collection('faucets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Faucet not found',
      });
    }

    const faucetData = doc.data();

    // Check if user owns this faucet or is admin
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin';

    if (faucetData.createdBy !== uid && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await db.collection('faucets').doc(id).delete();

    // Remove from all user favorites
    const favoritesQuery = await db.collection('userFavorites').get();
    const batch = db.batch();

    favoritesQuery.forEach(favDoc => {
      const favorites = favDoc.data().faucets || [];
      if (favorites.includes(id)) {
        const updatedFavorites = favorites.filter(faucetId => faucetId !== id);
        batch.update(favDoc.ref, { faucets: updatedFavorites });
      }
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'Faucet deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Search faucets
export const searchFaucets = async (req, res, next) => {
  try {
    const {
      q: searchQuery,
      page = 1,
      limit = 20,
      network,
      tags,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = req.query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    let query = db.collection('faucets').where('isActive', '==', true);

    // Apply filters
    if (network) {
      query = query.where('network', '==', network);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      query = query.where('tags', 'array-contains-any', tagArray);
    }

    const snapshot = await query.get();
    let faucets = [];

    snapshot.forEach(doc => {
      faucets.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Client-side search filtering
    const searchLower = searchQuery.toLowerCase();
    faucets = faucets.filter(faucet => {
      const nameMatch = faucet.name.toLowerCase().includes(searchLower);
      const descMatch = faucet.description?.toLowerCase().includes(searchLower);
      const networkMatch = faucet.network.toLowerCase().includes(searchLower);
      const tokenMatch = faucet.tokenSymbol?.toLowerCase().includes(searchLower);
      const tagMatch = faucet.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      
      return nameMatch || descMatch || networkMatch || tokenMatch || tagMatch;
    });

    // Sort results
    faucets.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFaucets = faucets.slice(startIndex, endIndex);

    // Add user favorites if authenticated
    if (req.user) {
      const favoritesDoc = await db.collection('userFavorites').doc(req.user.uid).get();
      const favorites = favoritesDoc.exists ? favoritesDoc.data().faucets || [] : [];
      
      paginatedFaucets.forEach(faucet => {
        faucet.isFavorite = favorites.includes(faucet.id);
      });
    }

    res.json({
      success: true,
      data: {
        faucets: paginatedFaucets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(faucets.length / parseInt(limit)),
          totalCount: faucets.length,
          hasNextPage: endIndex < faucets.length,
          hasPrevPage: parseInt(page) > 1,
        },
        searchQuery,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get faucets by network
export const getFaucetsByNetwork = async (req, res, next) => {
  try {
    const { network } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = req.query;

    let query = db.collection('faucets')
      .where('network', '==', network)
      .where('isActive', '==', true);

    // Apply sorting
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, sortDirection);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const snapshot = await query.get();
    const faucets = [];

    snapshot.forEach(doc => {
      faucets.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Get total count for this network
    const countQuery = db.collection('faucets')
      .where('network', '==', network)
      .where('isActive', '==', true);
    const countSnapshot = await countQuery.get();
    const totalCount = countSnapshot.size;

    // Add user favorites if authenticated
    if (req.user) {
      const favoritesDoc = await db.collection('userFavorites').doc(req.user.uid).get();
      const favorites = favoritesDoc.exists ? favoritesDoc.data().faucets || [] : [];
      
      faucets.forEach(faucet => {
        faucet.isFavorite = favorites.includes(faucet.id);
      });
    }

    res.json({
      success: true,
      data: {
        faucets,
        network,
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

// Rate faucet
export const rateFaucet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Check if faucet exists
    const faucetDoc = await db.collection('faucets').doc(id).get();
    if (!faucetDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Faucet not found',
      });
    }

    // Check if user already rated this faucet
    const existingRatingQuery = await db.collection('faucetRatings')
      .where('faucetId', '==', id)
      .where('userId', '==', uid)
      .get();

    const now = new Date().toISOString();
    const ratingData = {
      faucetId: id,
      userId: uid,
      rating,
      comment: comment || '',
      createdAt: now,
      updatedAt: now,
    };

    if (!existingRatingQuery.empty) {
      // Update existing rating
      const existingRatingDoc = existingRatingQuery.docs[0];
      await existingRatingDoc.ref.update({
        rating,
        comment: comment || '',
        updatedAt: now,
      });
    } else {
      // Create new rating
      await db.collection('faucetRatings').add(ratingData);
    }

    // Recalculate faucet rating
    const allRatingsQuery = await db.collection('faucetRatings')
      .where('faucetId', '==', id)
      .get();

    let totalRating = 0;
    let ratingCount = 0;

    allRatingsQuery.forEach(doc => {
      totalRating += doc.data().rating;
      ratingCount++;
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Update faucet with new rating
    await db.collection('faucets').doc(id).update({
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      ratingCount,
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating,
        comment,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Report faucet
export const reportFaucet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { reason, description } = req.body;

    // Check if faucet exists
    const faucetDoc = await db.collection('faucets').doc(id).get();
    if (!faucetDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Faucet not found',
      });
    }

    const now = new Date().toISOString();
    const reportData = {
      faucetId: id,
      userId: uid,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: now,
    };

    await db.collection('faucetReports').add(reportData);

    // Increment report count on faucet
    const faucetData = faucetDoc.data();
    const newReportCount = (faucetData.reportCount || 0) + 1;
    
    await db.collection('faucets').doc(id).update({
      reportCount: newReportCount,
    });

    // Notify admins about the report
    const adminQuery = await db.collection('users').where('role', '==', 'admin').get();
    const adminPromises = [];
    
    adminQuery.forEach(adminDoc => {
      adminPromises.push(
        createNotification(adminDoc.id, {
          type: 'system',
          title: 'Faucet Reported',
          message: `Faucet "${faucetData.name}" has been reported for: ${reason}`,
          priority: 'high',
          data: {
            faucetId: id,
            faucetName: faucetData.name,
            reason,
          },
        })
      );
    });

    await Promise.all(adminPromises);

    res.json({
      success: true,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get faucet statistics
export const getFaucetStats = async (req, res, next) => {
  try {
    const faucetsSnapshot = await db.collection('faucets').get();
    
    let totalFaucets = 0;
    let activeFaucets = 0;
    let verifiedFaucets = 0;
    const networkStats = {};
    const tagStats = {};

    faucetsSnapshot.forEach(doc => {
      const faucet = doc.data();
      totalFaucets++;

      if (faucet.isActive) {
        activeFaucets++;
      }

      if (faucet.isVerified) {
        verifiedFaucets++;
      }

      // Network statistics
      if (faucet.network) {
        networkStats[faucet.network] = (networkStats[faucet.network] || 0) + 1;
      }

      // Tag statistics
      if (faucet.tags && Array.isArray(faucet.tags)) {
        faucet.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1;
        });
      }
    });

    // Get top networks and tags
    const topNetworks = Object.entries(networkStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([network, count]) => ({ network, count }));

    const topTags = Object.entries(tagStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      data: {
        totalFaucets,
        activeFaucets,
        verifiedFaucets,
        inactiveFaucets: totalFaucets - activeFaucets,
        topNetworks,
        topTags,
        networkCount: Object.keys(networkStats).length,
        tagCount: Object.keys(tagStats).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify faucet (admin only)
export const verifyFaucet = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Check if user is admin
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (userData?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    // Check if faucet exists
    const faucetDoc = await db.collection('faucets').doc(id).get();
    if (!faucetDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Faucet not found',
      });
    }

    await db.collection('faucets').doc(id).update({
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: uid,
    });

    // Notify faucet creator
    const faucetData = faucetDoc.data();
    if (faucetData.createdBy) {
      await createNotification(faucetData.createdBy, {
        type: 'system',
        title: 'Faucet Verified',
        message: `Your faucet "${faucetData.name}" has been verified and is now live!`,
        priority: 'medium',
        data: {
          faucetId: id,
          faucetName: faucetData.name,
        },
      });
    }

    res.json({
      success: true,
      message: 'Faucet verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get user favorites
export const getFavorites = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const favoritesDoc = await db.collection('userFavorites').doc(uid).get();
    
    if (!favoritesDoc.exists) {
      return res.json({
        success: true,
        data: {
          faucets: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    }

    const favoriteIds = favoritesDoc.data().faucets || [];
    
    if (favoriteIds.length === 0) {
      return res.json({
        success: true,
        data: {
          faucets: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    }

    // Get faucet details for favorites
    const faucetPromises = favoriteIds.map(id => 
      db.collection('faucets').doc(id).get()
    );

    const faucetDocs = await Promise.all(faucetPromises);
    const faucets = faucetDocs
      .filter(doc => doc.exists)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        isFavorite: true,
      }));

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFaucets = faucets.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        faucets: paginatedFaucets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(faucets.length / parseInt(limit)),
          totalCount: faucets.length,
          hasNextPage: endIndex < faucets.length,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add faucet to favorites
export const addToFavorites = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // Check if faucet exists
    const faucetDoc = await db.collection('faucets').doc(id).get();
    if (!faucetDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Faucet not found',
      });
    }

    // Get or create user favorites
    const favoritesDoc = await db.collection('userFavorites').doc(uid).get();
    let favorites = [];

    if (favoritesDoc.exists) {
      favorites = favoritesDoc.data().faucets || [];
    }

    // Add to favorites if not already present
    if (!favorites.includes(id)) {
      favorites.push(id);
      
      await db.collection('userFavorites').doc(uid).set({
        faucets: favorites,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    res.json({
      success: true,
      message: 'Faucet added to favorites',
    });
  } catch (error) {
    next(error);
  }
};

// Remove faucet from favorites
export const removeFromFavorites = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const favoritesDoc = await db.collection('userFavorites').doc(uid).get();
    
    if (!favoritesDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Favorites not found',
      });
    }

    const favorites = favoritesDoc.data().faucets || [];
    const updatedFavorites = favorites.filter(faucetId => faucetId !== id);

    await db.collection('userFavorites').doc(uid).update({
      faucets: updatedFavorites,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Faucet removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};