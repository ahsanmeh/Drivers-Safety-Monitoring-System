const User = require('../models/User');
const { sendSuccessResponse, sendErrorResponse, getPaginationOptions, sendPaginatedResponse } = require('../utils/responseHandler');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// Helper to normalize profile image path
const normalizeProfileImage = (user) => {
  if (user.profileImage && !user.profileImage.startsWith('/uploads/') && !user.profileImage.startsWith('http')) {
    user.profileImage = `/uploads/${user.profileImage}`;
  }
  return user;
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, role, isActive } = req.query;
  const pagination = getPaginationOptions(page, limit);

  // Build filter object
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Scope to admin's users if user is admin
  if (req.user.role === 'admin') {
    filter.adminId = req.user._id;
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  // Normalize profile images
  const usersWithImages = users.map(user => normalizeProfileImage(user.toObject()));

  const total = await User.countDocuments(filter);

  sendPaginatedResponse(res, 200, 'Users retrieved successfully', usersWithImages, {
    ...pagination,
    total
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or User themselves
const getUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Check if user can access this resource
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return sendErrorResponse(res, 403, 'Not authorized to access this user');
  }

  user = normalizeProfileImage(user.toObject());
  sendSuccessResponse(res, 200, 'User retrieved successfully', { user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin or User themselves
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, address, licenseNumber, gender, isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Check if user can update this resource
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return sendErrorResponse(res, 403, 'Not authorized to update this user');
  }

  // Non-admin users cannot change role or isActive status
  if (req.user.role !== 'admin') {
    delete req.body.role;
    delete req.body.isActive;
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, 400, 'Email already exists');
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  sendSuccessResponse(res, 200, 'User updated successfully', { user: updatedUser });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin only
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Prevent admin from deleting themselves
  if (req.user._id.toString() === req.params.id) {
    return sendErrorResponse(res, 400, 'Cannot delete your own account');
  }

  await User.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 200, 'User deleted successfully');
});

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin only
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Prevent admin from deactivating themselves
  if (req.user._id.toString() === req.params.id) {
    return sendErrorResponse(res, 400, 'Cannot deactivate your own account');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-password');

  sendSuccessResponse(res, 200, 'User deactivated successfully', { user: updatedUser });
});

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private/Admin only
const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select('-password');

  sendSuccessResponse(res, 200, 'User activated successfully', { user: updatedUser });
});

// @desc    Get drivers only
// @route   GET /api/users/drivers
// @access  Private/Admin
const getDrivers = asyncHandler(async (req, res) => {
  const { page, limit, isActive } = req.query;
  const pagination = getPaginationOptions(page, limit);

  const filter = { role: 'driver' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Scope to admin's drivers if user is admin
  if (req.user.role === 'admin') {
    filter.adminId = req.user._id;
  }

  const drivers = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  // Normalize profile images
  const driversWithImages = drivers.map(driver => normalizeProfileImage(driver.toObject()));

  const total = await User.countDocuments(filter);

  sendPaginatedResponse(res, 200, 'Drivers retrieved successfully', driversWithImages, {
    ...pagination,
    total
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getDrivers
};
