import { validationResult } from 'express-validator';

// Middleware to handle validation errors
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages,
    });
  }
  
  next();
};