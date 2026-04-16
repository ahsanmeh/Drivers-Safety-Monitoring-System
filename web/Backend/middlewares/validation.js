const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules (for registration - driver only)
const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('companyEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid company email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  // Note: role validation removed - registration always creates drivers
  body('phone')
    .optional()
    .isLength({ max: 15 })
    .withMessage('Phone number cannot be more than 15 characters'),
  body('licenseNumber')
    .optional()
    .isLength({ max: 20 })
    .withMessage('License number cannot be more than 20 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  handleValidationErrors
];

// User validation rules (for profile updates - no role changes)
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isLength({ max: 15 })
    .withMessage('Phone number cannot be more than 15 characters'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address cannot be more than 200 characters'),
  body('licenseNumber')
    .optional()
    .isLength({ max: 20 })
    .withMessage('License number cannot be more than 20 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  handleValidationErrors
];

// User validation rules (for admin updates - includes role)
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'driver'])
    .withMessage('Role must be either admin or driver'),
  body('phone')
    .optional()
    .isLength({ max: 15 })
    .withMessage('Phone number cannot be more than 15 characters'),
  body('licenseNumber')
    .optional()
    .isLength({ max: 20 })
    .withMessage('License number cannot be more than 20 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  handleValidationErrors
];

// Vehicle validation rules
const validateVehicle = [
  body('make')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Make must be between 1 and 50 characters'),
  body('model')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model must be between 1 and 50 characters'),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be a valid year'),
  body('licensePlate')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('License plate must be between 1 and 20 characters'),
  body('vin')
    .optional()
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be exactly 17 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance', 'retired'])
    .withMessage('Status must be one of: active, inactive, maintenance, retired'),
  handleValidationErrors
];

// Trip validation rules
const validateTrip = [
  body('assignedDriver')
    .isMongoId()
    .withMessage('Valid driver ID is required'),
  body('assignedVehicle')
    .isMongoId()
    .withMessage('Valid vehicle ID is required'),
  body('startLocation.address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Start address is required'),
  body('startLocation.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid start latitude is required'),
  body('startLocation.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid start longitude is required'),
  body('endLocation.address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('End address is required'),
  body('endLocation.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid end latitude is required'),
  body('endLocation.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid end longitude is required'),
  body('scheduledStartTime')
    .isISO8601()
    .withMessage('Valid scheduled start time is required'),
  body('scheduledEndTime')
    .isISO8601()
    .withMessage('Valid scheduled end time is required'),
  handleValidationErrors
];

// Trip status update validation rules
const validateTripStatusUpdate = [
  body('status')
    .isIn(['in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be one of: in_progress, completed, cancelled'),
  body('actualStartTime')
    .optional()
    .isISO8601()
    .withMessage('Valid actual start time is required'),
  body('actualEndTime')
    .optional()
    .isISO8601()
    .withMessage('Valid actual end time is required'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters'),
  handleValidationErrors
];

// Incident validation rules
const validateIncident = [
  body('driver')
    .isMongoId()
    .withMessage('Valid driver ID is required'),
  body('vehicle')
    .isMongoId()
    .withMessage('Valid vehicle ID is required'),
  body('incidentType')
    .isIn([
      'smoke_detection',
      'phone_usage',
      'drowsiness',
      'overspeeding',
      'harsh_brake'
    ])
    .withMessage('Valid incident type is required'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical'),
  body('location.address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Incident location is required'),
  body('location.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('location.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array'),
  body('questions.*.question')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question must be between 1 and 500 characters'),
  body('questions.*.isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  handleValidationErrors
];

// Answer questions validation
const validateAnswerQuestions = [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  body('answers.*.questionIndex')
    .isInt({ min: 0 })
    .withMessage('Question index must be a non-negative integer'),
  body('answers.*.answer')
    .custom((value) => {
      // If answer is provided and not empty, validate length
      if (value !== undefined && value !== null && value.trim() !== '') {
        if (value.trim().length < 1 || value.trim().length > 1000) {
          throw new Error('Answer must be between 1 and 1000 characters if provided');
        }
      }
      return true;
    }),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} ID is required`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateProfileUpdate,
  validateUserUpdate,
  validateVehicle,
  validateTrip,
  validateTripStatusUpdate,
  validateIncident,
  validateAnswerQuestions,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};
