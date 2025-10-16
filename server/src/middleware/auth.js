import { getAuth } from '../config/firebase.js';

// Middleware to verify Firebase ID token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    let message = 'Invalid or expired token';
    let statusCode = 401;

    if (error.code === 'auth/id-token-expired') {
      message = 'Token has expired';
    } else if (error.code === 'auth/id-token-revoked') {
      message = 'Token has been revoked';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Invalid token format';
    }

    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
};

// Middleware to check if user email is verified
export const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
    });
  }
  next();
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};