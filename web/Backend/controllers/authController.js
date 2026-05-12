const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { generateToken } = require('../utils/jwt');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');
const { storeOTP, verifyOTP, removeOTP } = require('../utils/otpStorage');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Helper: call Python face recognition service to compare two images
const normalizeProfileImageValue = (profileImage) => {
  if (!profileImage) return null;
  return profileImage.startsWith('/uploads/')
    ? profileImage.replace('/uploads/', '')
    : profileImage;
};

const getProfileImageUrl = (profileImage) => {
  if (!profileImage) return null;
  return profileImage.startsWith('/uploads/')
    ? profileImage
    : `/uploads/${profileImage}`;
};

const buildUserResponse = (user) => {
  // Calculate password expiry info
  const passwordExpiryDays = user.settings?.security?.passwordExpiryDays || 90;
  const passwordExpiryDate = new Date(user.passwordChangedAt || user.createdAt);
  passwordExpiryDate.setDate(passwordExpiryDate.getDate() + passwordExpiryDays);
  const daysUntilExpiry = Math.ceil((passwordExpiryDate - new Date()) / (1000 * 60 * 60 * 24));
  const passwordExpiryWarning = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return {
    _id: user._id,
    driverId: user.driverId,
    adminId: user.adminId,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    department: user.department,
    licenseNumber: user.licenseNumber,
    gender: user.gender,
    profileImage: getProfileImageUrl(user.profileImage),
    isActive: user.isActive,
    totalDrivingSeconds: user.totalDrivingSeconds || 0,
    safeTripCount: user.safeTripCount || 0,
    passwordChangedAt: user.passwordChangedAt,
    passwordExpiryDate: passwordExpiryDate,
    daysUntilPasswordExpiry: daysUntilExpiry,
    passwordExpiryWarning: passwordExpiryWarning,
    settings: user.settings,
    createdAt: user.createdAt,
    vehicle: user.vehicle // Injected manually from controller
  };
};

const compareFaces = async (referenceImagePath, liveImageBase64, driverId, driverName) => {
  const refBuffer = fs.readFileSync(referenceImagePath);
  const referenceB64 = refBuffer.toString('base64');

  const pythonUrl = process.env.PYTHON_SERVER_URL || 'http://127.0.0.1:8000';
  const response = await axios.post(
    `${pythonUrl}/compare-faces`,
    {
      reference_image: referenceB64,
      live_image: liveImageBase64,
      driver_id: driverId,
      driver_name: driverName
    },
    {
      // Per-driver timeout: 15 seconds should be enough for face recognition
      // If checking many drivers, this prevents one slow check from blocking everything
      timeout: 15000
    }
  );

  // Debug log: show raw response from Python service
  console.log('Face API response:', {
    status: response.status,
    data: response.data
  });

  const { distance, match, similarity, error } = response.data || {};

  // If the Python service explicitly returned an error message, surface it
  if (error) {
    throw new Error(error);
  }

  // Support older Python API that returns { similarity } instead of { distance, match }
  if (typeof similarity === 'number') {
    return { similarity };
  }

  if (typeof distance === 'number' && typeof match === 'boolean') {
    // Lower distance = more similar face
    return { distance, match };
  }

  throw new Error('Invalid response from face recognition service');
};

// @desc    Register user (Driver only)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, licenseNumber, gender, companyEmail } = req.body;

  // Validate company email is provided
  if (!companyEmail) {
    if (req.file) fs.unlinkSync(req.file.path); // Cleanup uploaded file
    return sendErrorResponse(res, 400, 'Company email is required');
  }

  // Validate profile image is provided
  if (!req.file) {
    return sendErrorResponse(res, 400, 'Profile picture is required');
  }

  const normalizedCompanyEmail = companyEmail ? companyEmail.trim().toLowerCase() : '';

  // Find admin by company email
  const admin = await User.findOne({
    email: normalizedCompanyEmail,
    role: 'admin'
  });

  if (!admin) {
    if (req.file) fs.unlinkSync(req.file.path); // Cleanup uploaded file
    return sendErrorResponse(res, 400, 'Company email not found. Please contact your administrator.');
  }

  // Normalize email to prevent trailing space issues
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (req.file) fs.unlinkSync(req.file.path); // Cleanup uploaded file
    return sendErrorResponse(res, 400, 'User already exists with this email');
  }


  // Bypass Face Validation: Accept the image as it is without sending it to the Python server.
  // try {
  //   const imageBuffer = fs.readFileSync(req.file.path);
  //   const imageBase64 = imageBuffer.toString('base64');

  //   const pythonUrl = process.env.PYTHON_SERVER_URL || 'http://127.0.0.1:8000';
  //   await axios.post(`${pythonUrl}/detect-face`, {
  //     image: imageBase64
  //   });
  // } catch (error) {
  //   if (req.file) fs.unlinkSync(req.file.path); // Cleanup uploaded file
  //   const errorMessage = error.response?.data?.error || 'Face detection failed';
  //   return sendErrorResponse(res, 400, errorMessage);
  // }


  // Create user - ALWAYS create as driver (security measure)
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: 'driver', // Force driver role - admins created via script only
    adminId: admin._id, // Assign driver to admin
    phone,
    address,
    licenseNumber,
    gender,
    profileImage: req.file.filename, // Save filename
    isActive: false // New drivers need admin approval to login
  });

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    adminId: user.adminId,
    phone: user.phone,
    address: user.address,
    licenseNumber: user.licenseNumber,
    gender: user.gender,
    profileImage: getProfileImageUrl(user.profileImage),
    isActive: user.isActive,
    createdAt: user.createdAt
  };

  sendSuccessResponse(res, 201, 'User registered successfully. Your account is pending admin approval.', {
    user: userResponse,
    token
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Normalize email to prevent trailing space issues
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  // Check if user exists and include password for comparison
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    return sendErrorResponse(res, 401, 'Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    return sendErrorResponse(res, 401, 'Your account is pending admin approval. Please contact administrator.');
  }

  // Check if account is locked
  if (user.isLocked()) {
    const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60); // minutes remaining
    return sendErrorResponse(res, 423, `Account is locked due to too many failed login attempts. Please try again in ${lockTime} minute(s).`);
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    // Increment login attempts
    await user.incLoginAttempts();

    // Check if account is now locked
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return sendErrorResponse(res, 423, `Too many failed login attempts. Account locked for ${lockTime} minute(s).`);
    }

    // Get remaining attempts
    const maxAttempts = user.settings?.security?.maxLoginAttempts || 5;
    const remainingAttempts = maxAttempts - user.loginAttempts;

    return sendErrorResponse(res, 401, `Invalid credentials. ${remainingAttempts} attempt(s) remaining.`);
  }

  // Password is correct - reset login attempts
  await user.resetLoginAttempts();

  // Check password expiry
  const passwordExpiryDays = user.settings?.security?.passwordExpiryDays || 90;
  const passwordExpiryDate = new Date(user.passwordChangedAt);
  passwordExpiryDate.setDate(passwordExpiryDate.getDate() + passwordExpiryDays);
  const isPasswordExpired = new Date() > passwordExpiryDate;

  if (isPasswordExpired) {
    // Password expired - generate reset token and send email
    const daysExpired = Math.ceil((new Date() - passwordExpiryDate) / (1000 * 60 * 60 * 24));

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token to user (expires in 1 hour)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name, daysExpired);
    } catch (error) {
      // If email fails, remove the token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return sendErrorResponse(res, 500, 'Failed to send password reset email. Please try again.');
    }

    return sendErrorResponse(res, 403, {
      passwordExpired: true,
      message: `Your password has expired ${daysExpired} day(s) ago. A password reset link has been sent to your email (${user.email}). Please check your email to reset your password.`,
      daysExpired: daysExpired,
      email: user.email // Only send email, not userId for security
    });
  }

  // Check if 2FA is enabled
  const is2FAEnabled = user.settings?.security?.twoFactorEnabled === true;

  if (is2FAEnabled) {
    // Generate and store OTP
    const otpCode = storeOTP(user._id.toString(), user.email, 10); // 10 minutes expiry

    // Send OTP via email
    try {
      await sendOTPEmail(user.email, otpCode, user.name);
    } catch (error) {
      // Remove OTP if email fails
      removeOTP(user._id.toString());
      return sendErrorResponse(res, 500, 'Failed to send verification code. Please try again.');
    }

    // Return response indicating 2FA is required
    return sendSuccessResponse(res, 200, 'Two-factor authentication required. Please check your email for the verification code.', {
      requires2FA: true,
      userId: user._id.toString(),
      message: 'Verification code sent to your email'
    });
  }

  // 2FA not enabled - proceed with normal login
  // Generate token with user's session timeout setting
  const sessionTimeout = user.settings?.security?.sessionTimeoutMinutes || 30;
  const token = await generateToken(user._id, sessionTimeout);

  // Fetch assigned vehicle
  const vehicle = await Vehicle.findOne({ assignedDriver: user._id, status: 'active' });

  // Attach vehicle to user object for response builder
  const userWithVehicle = user.toObject();
  userWithVehicle.vehicle = vehicle;

  sendSuccessResponse(res, 200, 'Login successful', {
    user: buildUserResponse(userWithVehicle),
    token
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Fetch assigned vehicle
  const vehicle = await Vehicle.findOne({ assignedDriver: user._id, status: 'active' });

  // Attach vehicle to user object for response builder
  const userWithVehicle = user.toObject();
  userWithVehicle.vehicle = vehicle;

  sendSuccessResponse(res, 200, 'Profile retrieved successfully', { user: buildUserResponse(userWithVehicle) });
});

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, email, phone, address, department, licenseNumber, gender, settings } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Handle settings update - merge with existing settings
  const updateData = {
    name,
    email,
    phone,
    address,
    department,
    licenseNumber,
    gender
  };

  if (settings) {
    // Get existing settings or use empty object
    const existingSettings = user.settings ? user.settings.toObject() : {};
    const existingNotifications = existingSettings.notifications || {};
    const existingSystem = existingSettings.system || {};
    const existingNotificationAlerts = existingSettings.notificationAlerts || {};
    const existingNotificationChannels = existingSettings.notificationChannels || {};
    const existingSecurity = existingSettings.security || {};

    // Merge settings with existing settings to preserve nested structure
    updateData.settings = {
      ...existingSettings,
      ...settings,
      notifications: {
        ...existingNotifications,
        ...(settings.notifications || {})
      },
      system: {
        ...existingSystem,
        ...(settings.system || {})
      },
      notificationAlerts: {
        ...existingNotificationAlerts,
        ...(settings.notificationAlerts || {})
      },
      notificationChannels: {
        ...existingNotificationChannels,
        ...(settings.notificationChannels || {})
      },
      security: {
        ...existingSecurity,
        ...(settings.security || {})
      }
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  sendSuccessResponse(res, 200, 'Profile updated successfully', { user: buildUserResponse(updatedUser) });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return sendErrorResponse(res, 400, 'Current password is incorrect');
  }

  // Update password (passwordChangedAt will be updated automatically by pre-save hook)
  user.password = newPassword;
  await user.save();

  // Calculate new expiry date
  const passwordExpiryDays = user.settings?.security?.passwordExpiryDays || 90;
  const newExpiryDate = new Date();
  newExpiryDate.setDate(newExpiryDate.getDate() + passwordExpiryDays);

  sendSuccessResponse(res, 200, 'Password changed successfully', {
    passwordChangedAt: user.passwordChangedAt,
    passwordExpiryDate: newExpiryDate,
    daysUntilExpiry: passwordExpiryDays
  });
});

// @desc    Upload profile image
// @route   POST /api/auth/upload-profile-image
// @access  Private
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, 'No image file provided');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Delete old profile image if exists
  if (user.profileImage) {
    const oldImageValue = normalizeProfileImageValue(user.profileImage);
    if (oldImageValue) {
      const oldImagePath = path.join(__dirname, '../uploads', oldImageValue);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
  }

  // Update user with new profile image filename
  user.profileImage = req.file.filename;
  await user.save();

  // Return the image URL
  const imageUrl = `/uploads/${req.file.filename}`;

  sendSuccessResponse(res, 200, 'Profile image uploaded successfully', {
    profileImage: imageUrl,
    filename: req.file.filename
  });
});

// @desc    Face-based login using stored profile images
// @route   POST /api/auth/face-login
// @access  Public

// @desc    Face-based login using stored profile images
// @route   POST /api/auth/face-login
// @access  Public
const verifyFace = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendErrorResponse(res, 400, 'No face image provided');
  }

  const cleanupLiveImage = () => {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => { });
    }
  };

  const drivers = await User.find({
    role: 'driver',
    isActive: true,
    profileImage: { $ne: null }
  });

  if (!drivers.length) {
    cleanupLiveImage();
    return sendErrorResponse(res, 404, 'No registered drivers with profile images found');
  }

  let liveImageBase64;
  try {
    const liveBuffer = fs.readFileSync(req.file.path);
    liveImageBase64 = liveBuffer.toString('base64');
  } catch (err) {
    cleanupLiveImage();
    return sendErrorResponse(res, 500, 'Unable to read captured image for comparison');
  }

  // Thresholds - Standard Security
  const SIMILARITY_THRESHOLD = 0.4;
  const DISTANCE_THRESHOLD = 0.6;
  let bestMatch = null;

  for (const driver of drivers) {
    const normalizedProfileImage = normalizeProfileImageValue(driver.profileImage);
    if (!normalizedProfileImage) {
      continue;
    }

    const referenceImagePath = path.join(__dirname, '../uploads', normalizedProfileImage);
    if (!fs.existsSync(referenceImagePath)) {
      continue;
    }

    try {
      const result = await compareFaces(referenceImagePath, liveImageBase64, driver._id, driver.name);

      // Prefer distance/match mode as it is more precise
      if (typeof result.distance === 'number') {
        if (!bestMatch || result.distance < (bestMatch.distance ?? Infinity)) {
          bestMatch = { user: driver, distance: result.distance, match: result.match, similarity: result.similarity };

          // Early exit: if we found a good match, stop checking
          if (result.distance <= DISTANCE_THRESHOLD) {
            break;
          }
        }
      }
      // Fallback for similarity
      else if (typeof result.similarity === 'number') {
        if (!bestMatch || result.similarity > (bestMatch.similarity ?? -1)) {
          bestMatch = { user: driver, similarity: result.similarity };

          if (result.similarity >= SIMILARITY_THRESHOLD) {
            break;
          }
        }
      }
    } catch (err) {
      // Log timeout errors specifically
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        console.error(`Face comparison timeout for driver ${driver._id}, skipping...`);
      }
      // Continue to next driver instead of failing completely
      continue;
    }
  }

  cleanupLiveImage();

  if (!bestMatch) {
    return sendErrorResponse(res, 401, 'Face not recognized. Please try again or use manual login.');
  }

  // Final check against thresholds
  if (typeof bestMatch.distance === 'number') {
    if (bestMatch.distance > DISTANCE_THRESHOLD) {
      return sendErrorResponse(res, 401, 'Face not recognized. Please try again or use manual login.');
    }
  } else if (typeof bestMatch.similarity === 'number') {
    if (bestMatch.similarity < SIMILARITY_THRESHOLD) {
      return sendErrorResponse(res, 401, 'Face not recognized. Please try again or use manual login.');
    }
  }

  const token = generateToken(bestMatch.user._id);
  const userResponse = buildUserResponse(bestMatch.user);

  sendSuccessResponse(res, 200, 'Face login successful', {
    user: userResponse,
    token,
    distance: bestMatch.distance,
    similarity: bestMatch.similarity
  });
});

// @desc    Update total driving time
// @route   PUT /api/auth/update-driving-time
// @access  Private
const updateDrivingTime = asyncHandler(async (req, res) => {
  const { seconds } = req.body;

  if (typeof seconds !== 'number' || seconds < 0) {
    return sendErrorResponse(res, 400, 'Invalid seconds value');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { totalDrivingSeconds: seconds } },
    { new: true }
  );

  sendSuccessResponse(res, 200, 'Driving time updated successfully', {
    totalDrivingSeconds: user.totalDrivingSeconds
  });
});

// @desc    Increment safe trip count
// @route   PUT /api/auth/increment-safe-trip
// @access  Private
const incrementSafeTripCount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { safeTripCount: 1 } },
    { new: true }
  );

  sendSuccessResponse(res, 200, 'Safe trip count incremented successfully', {
    safeTripCount: user.safeTripCount
  });
});

// @desc    Request password reset (for expired passwords or forgot password)
// @route   POST /api/auth/request-password-reset
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendErrorResponse(res, 400, 'Email is required');
  }

  // Find user by email
  console.log(`Password reset request for: ${email}`);
  const user = await User.findOne({ email: email.toLowerCase() });

  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    console.log(`User not found for email: ${email}`);
    // Still return success to prevent email enumeration
    return sendSuccessResponse(res, 200, 'If an account with that email exists, a password reset link has been sent.');
  }

  console.log(`Found user: ${user.name} (${user.role})`);

  // Check if password is expired
  const passwordExpiryDays = user.settings?.security?.passwordExpiryDays || 90;
  const passwordExpiryDate = new Date(user.passwordChangedAt);
  passwordExpiryDate.setDate(passwordExpiryDate.getDate() + passwordExpiryDays);
  const isPasswordExpired = new Date() > passwordExpiryDate;
  const daysExpired = isPasswordExpired ? Math.ceil((new Date() - passwordExpiryDate) / (1000 * 60 * 60 * 24)) : 0;

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Save hashed token to user (expires in 1 hour)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // Send password reset email
  try {
    await sendPasswordResetEmail(user.email, resetToken, user.name, daysExpired);
    return sendSuccessResponse(res, 200, 'Password reset link has been sent to your email.', {
      email: user.email // Only return email for confirmation
    });
  } catch (error) {
    // If email fails, remove the token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return sendErrorResponse(res, 500, 'Failed to send password reset email. Please try again.');
  }
});

// @desc    Reset password using token (from email link)
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return sendErrorResponse(res, 400, 'Token and new password are required');
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() } // Token not expired
  }).select('+password');

  if (!user) {
    return sendErrorResponse(res, 400, 'Invalid or expired password reset token. Please request a new one.');
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new token after password change
  const sessionTimeout = user.settings?.security?.sessionTimeoutMinutes || 30;
  const authToken = await generateToken(user._id, sessionTimeout);

  // Calculate new expiry date
  const passwordExpiryDays = user.settings?.security?.passwordExpiryDays || 90;
  const newExpiryDate = new Date();
  newExpiryDate.setDate(newExpiryDate.getDate() + passwordExpiryDays);

  sendSuccessResponse(res, 200, 'Password reset successfully. You can now login.', {
    user: buildUserResponse(user),
    token: authToken
  });
});

// @desc    Verify 2FA OTP and complete login
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FA = asyncHandler(async (req, res) => {
  const { userId, otpCode } = req.body;

  // Validate input
  if (!userId || !otpCode) {
    return sendErrorResponse(res, 400, 'User ID and OTP code are required');
  }

  // Verify OTP
  const verification = verifyOTP(userId, otpCode);

  if (!verification.valid) {
    return sendErrorResponse(res, 400, verification.message);
  }

  // OTP is valid - get user and generate token
  const user = await User.findById(userId);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Check if user is active
  if (!user.isActive) {
    return sendErrorResponse(res, 401, 'Your account is pending admin approval. Please contact administrator.');
  }

  // Verify 2FA is still enabled (security check)
  const is2FAEnabled = user.settings?.security?.twoFactorEnabled === true;
  if (!is2FAEnabled) {
    return sendErrorResponse(res, 400, 'Two-factor authentication is not enabled for this account');
  }

  // Check password expiry
  const passwordExpiryDays = user.settings?.security?.passwordExpiryDays || 90;
  const passwordExpiryDate = new Date(user.passwordChangedAt);
  passwordExpiryDate.setDate(passwordExpiryDate.getDate() + passwordExpiryDays);
  const isPasswordExpired = new Date() > passwordExpiryDate;

  if (isPasswordExpired) {
    // Password expired - generate reset token and send email
    const daysExpired = Math.ceil((new Date() - passwordExpiryDate) / (1000 * 60 * 60 * 24));

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token to user (expires in 1 hour)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name, daysExpired);
    } catch (error) {
      // If email fails, remove the token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return sendErrorResponse(res, 500, 'Failed to send password reset email. Please try again.');
    }

    return sendErrorResponse(res, 403, {
      passwordExpired: true,
      message: `Your password has expired ${daysExpired} day(s) ago. A password reset link has been sent to your email (${user.email}). Please check your email to reset your password.`,
      daysExpired: daysExpired,
      email: user.email // Only send email, not userId for security
    });
  }

  // Generate token with user's session timeout setting
  const sessionTimeout = user.settings?.security?.sessionTimeoutMinutes || 30;
  const token = await generateToken(user._id, sessionTimeout);

  // Calculate password expiry info
  const daysUntilExpiry = Math.ceil((passwordExpiryDate - new Date()) / (1000 * 60 * 60 * 24));
  const passwordExpiryWarning = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  // Remove password from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    department: user.department,
    licenseNumber: user.licenseNumber,
    gender: user.gender,
    isActive: user.isActive,
    settings: user.settings,
    passwordChangedAt: user.passwordChangedAt,
    passwordExpiryDate: passwordExpiryDate,
    daysUntilPasswordExpiry: daysUntilExpiry,
    passwordExpiryWarning: passwordExpiryWarning,
    createdAt: user.createdAt
  };

  sendSuccessResponse(res, 200, 'Two-factor authentication verified. Login successful', {
    user: userResponse,
    token
  });
});

// @desc    Resend 2FA OTP
// @route   POST /api/auth/resend-2fa
// @access  Public
const resend2FA = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return sendErrorResponse(res, 400, 'User ID is required');
  }

  const user = await User.findById(userId);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Check if 2FA is enabled
  const is2FAEnabled = user.settings?.security?.twoFactorEnabled === true;
  if (!is2FAEnabled) {
    return sendErrorResponse(res, 400, 'Two-factor authentication is not enabled for this account');
  }

  // Generate and store new OTP
  const otpCode = storeOTP(user._id.toString(), user.email, 10);

  // Send OTP via email
  try {
    await sendOTPEmail(user.email, otpCode, user.name);
    sendSuccessResponse(res, 200, 'Verification code resent to your email', {
      message: 'New verification code sent'
    });
  } catch (error) {
    removeOTP(user._id.toString());
    return sendErrorResponse(res, 500, 'Failed to send verification code. Please try again.');
  }
});

module.exports = {
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
};
