// Request Validation Middleware
// Validates and sanitizes incoming requests

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for order creation
 */
export const validateOrderCreation = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('customerPhone').trim().notEmpty().withMessage('Customer phone is required'),
  body('customerEmail').optional().isEmail().withMessage('Invalid email'),
  body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
  body('total').isFloat({ min: 0.01 }).withMessage('Total must be greater than 0'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('email').trim().isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

/**
 * Validation rules for user registration
 */
export const validateRegistration = [
  body('email').trim().isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().trim(),
  handleValidationErrors
];

/**
 * Validation for coordinates
 */
export const validateCoordinates = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  handleValidationErrors
];

/**
 * Validation for ETA calculation
 */
export const validateETARequest = [
  body('restaurantLat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid restaurant latitude'),
  body('restaurantLng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid restaurant longitude'),
  body('customerLat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid customer latitude'),
  body('customerLng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid customer longitude'),
  handleValidationErrors
];

/**
 * Validation for batch ETA
 */
export const validateBatchETA = [
  body('restaurantLat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid restaurant latitude'),
  body('restaurantLng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid restaurant longitude'),
  body('deliveryAddresses')
    .isArray({ min: 1, max: 50 })
    .withMessage('Between 1 and 50 addresses required'),
  body('deliveryAddresses.*.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude in addresses'),
  body('deliveryAddresses.*.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude in addresses'),
  handleValidationErrors
];

/**
 * Validate UUID format
 */
export const validateUUID = param('id')
  .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .withMessage('Invalid ID format');

/**
 * Validate tenant ID
 */
export const validateTenantId = param('tenantId')
  .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .withMessage('Invalid tenant ID format');
