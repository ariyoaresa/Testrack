import { getAuth, getFirestore } from '../config/firebase.js';
import { sendEmail } from '../services/emailService.js';

const auth = getAuth();
const db = getFirestore();

// Register new user
export const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Create user with Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || null,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: displayName || null,
      photoURL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        reminderTime: 12, // hours before deadline
      },
      stats: {
        totalTestnets: 0,
        completedTestnets: 0,
        missedDeadlines: 0,
      },
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(email);
    
    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Welcome to Testrack - Verify Your Email',
      template: 'emailVerification',
      data: {
        displayName: displayName || 'User',
        verificationLink,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Note: Firebase Auth handles login on the client side
    // This endpoint is mainly for additional server-side validation
    // and to update last login time

    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Update last login time in Firestore
    await db.collection('users').doc(userRecord.uid).update({
      lastLoginAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = async (req, res, next) => {
  try {
    const { uid } = req.user;

    // Revoke all refresh tokens for the user
    await auth.revokeRefreshTokens(uid);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { uid } = req.user;

    // Get updated user record
    const userRecord = await auth.getUser(uid);

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // Send password reset email
    await sendEmail({
      to: email,
      subject: 'Testrack - Password Reset Request',
      template: 'passwordReset',
      data: {
        resetLink,
      },
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { oobCode, newPassword } = req.body;

    // Verify the password reset code and update password
    await auth.confirmPasswordReset(oobCode, newPassword);

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req, res, next) => {
  try {
    const { oobCode } = req.body;

    // Apply the email verification code
    await auth.applyActionCode(oobCode);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Generate new verification link
    const verificationLink = await auth.generateEmailVerificationLink(email);

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Testrack - Email Verification',
      template: 'emailVerification',
      data: {
        verificationLink,
      },
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile
export const getProfile = async (req, res, next) => {
  try {
    const { uid } = req.user;

    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    const userProfile = userDoc.data();

    res.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { displayName, photoURL, preferences } = req.body;

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    // Update Firebase Auth profile
    const authUpdateData = {};
    if (displayName !== undefined) {
      authUpdateData.displayName = displayName;
      updateData.displayName = displayName;
    }
    if (photoURL !== undefined) {
      authUpdateData.photoURL = photoURL;
      updateData.photoURL = photoURL;
    }

    if (Object.keys(authUpdateData).length > 0) {
      await auth.updateUser(uid, authUpdateData);
    }

    // Update preferences if provided
    if (preferences) {
      updateData.preferences = preferences;
    }

    // Update Firestore profile
    await db.collection('users').doc(uid).update(updateData);

    // Get updated profile
    const updatedDoc = await db.collection('users').doc(uid).get();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedDoc.data(),
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
export const deleteAccount = async (req, res, next) => {
  try {
    const { uid } = req.user;

    // Delete user data from Firestore
    const batch = db.batch();
    
    // Delete user profile
    batch.delete(db.collection('users').doc(uid));
    
    // Delete user's testnets
    const testnetsSnapshot = await db.collection('testnets')
      .where('userId', '==', uid)
      .get();
    
    testnetsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', uid)
      .get();
    
    notificationsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Delete user from Firebase Auth
    await auth.deleteUser(uid);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};