// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    let message = 'Authentication error';
    let statusCode = 401;

    switch (err.code) {
      case 'auth/user-not-found':
        message = 'User not found';
        statusCode = 404;
        break;
      case 'auth/wrong-password':
        message = 'Invalid credentials';
        statusCode = 401;
        break;
      case 'auth/email-already-in-use':
        message = 'Email already registered';
        statusCode = 400;
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        statusCode = 400;
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        statusCode = 400;
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        statusCode = 429;
        break;
      default:
        message = err.message || 'Authentication error';
    }

    error = { message, statusCode };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 Not Found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};