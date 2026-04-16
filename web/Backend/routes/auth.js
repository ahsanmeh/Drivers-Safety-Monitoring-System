const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  uploadProfileImage,
  verifyFace,
  updateDrivingTime,
  incrementSafeTripCount,
  requestPasswordReset,
  resetPassword,
  verify2FA,
  resend2FA
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validateUser, validateProfileUpdate } = require('../middlewares/validation');
const { uploadProfileImage: uploadMiddleware, uploadFaceImage, handleUploadError } = require('../middlewares/upload');

// Public routes
router.post('/register', uploadMiddleware, handleUploadError, validateUser, register);
router.post('/login', login);
router.post('/face-login', uploadFaceImage, handleUploadError, verifyFace);
router.post('/verify-2fa', verify2FA);
router.post('/resend-2fa', resend2FA);
router.post('/request-password-reset', requestPasswordReset);
router.put('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, validateProfileUpdate, updateMe);
router.put('/change-password', protect, changePassword);
router.post('/upload-profile-image', protect, uploadMiddleware, handleUploadError, uploadProfileImage);
router.put('/update-driving-time', protect, updateDrivingTime);
router.put('/increment-safe-trip', protect, incrementSafeTripCount);

module.exports = router;
