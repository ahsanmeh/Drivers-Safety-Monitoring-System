const Trip = require('../models/Trip');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { sendSuccessResponse, sendErrorResponse, getPaginationOptions, sendPaginatedResponse } = require('../utils/responseHandler');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// Helper function to generate trip number
const generateTripNumber = async () => {
  const count = await Trip.countDocuments();
  return `TRP${String(count + 1).padStart(6, '0')}`;
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private/Admin (all trips) or Driver (their trips only)
const getTrips = asyncHandler(async (req, res) => {
  const { page, limit, status, assignedDriver, assignedVehicle } = req.query;
  const pagination = getPaginationOptions(page, limit);

  // Build filter object
  const filter = {};

  // Drivers can only see their own trips
  if (req.user.role === 'driver') {
    filter.assignedDriver = req.user._id;
  } else if (req.user.role === 'admin') {
    // Admin can only see trips for their drivers
    const adminDrivers = await User.find({ adminId: req.user._id }).distinct('_id');

    // If specific driver requested, ensure they belong to admin
    if (assignedDriver) {
      if (adminDrivers.map(id => id.toString()).includes(assignedDriver)) {
        filter.assignedDriver = assignedDriver;
      } else {
        // Requested driver doesn't belong to admin -> return no results
        filter.assignedDriver = null;
      }
    } else {
      // Otherwise show all trips for admin's drivers
      filter.assignedDriver = { $in: adminDrivers };
    }

    if (assignedVehicle) filter.assignedVehicle = assignedVehicle;
  }

  if (status) filter.status = status;

  const trips = await Trip.find(filter)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate')
    .sort({ scheduledStartTime: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Trip.countDocuments(filter);

  sendPaginatedResponse(res, 200, 'Trips retrieved successfully', trips, {
    ...pagination,
    total
  });
});

// @desc    Get trip by ID
// @route   GET /api/trips/:id
// @access  Private/Admin or assigned driver
const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate color');

  if (!trip) {
    return sendErrorResponse(res, 404, 'Trip not found');
  }

  // Check if user can access this trip
  if (req.user.role !== 'admin' &&
    trip.assignedDriver._id.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Not authorized to access this trip');
  }

  sendSuccessResponse(res, 200, 'Trip retrieved successfully', { trip });
});

// @desc    Create trip
// @route   POST /api/trips
// @access  Private/Admin only
const createTrip = asyncHandler(async (req, res) => {
  const {
    assignedDriver,
    assignedVehicle,
    startLocation,
    endLocation,
    scheduledStartTime,
    scheduledEndTime,
    distance,
    estimatedDuration,
    notes
  } = req.body;

  // Validate driver exists and is a driver
  const driver = await User.findById(assignedDriver);
  if (!driver) {
    return sendErrorResponse(res, 400, 'Assigned driver not found');
  }
  if (driver.role !== 'driver') {
    return sendErrorResponse(res, 400, 'Assigned user must be a driver');
  }

  // Validate vehicle exists
  const vehicle = await Vehicle.findById(assignedVehicle);
  if (!vehicle) {
    return sendErrorResponse(res, 400, 'Assigned vehicle not found');
  }

  // Generate trip number
  const tripNumber = await generateTripNumber();

  const trip = await Trip.create({
    tripNumber,
    assignedDriver,
    assignedVehicle,
    startLocation,
    endLocation,
    scheduledStartTime,
    scheduledEndTime,
    distance,
    estimatedDuration,
    notes
  });

  const populatedTrip = await Trip.findById(trip._id)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate');

  sendSuccessResponse(res, 201, 'Trip created successfully', { trip: populatedTrip });
});

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private/Admin only
const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return sendErrorResponse(res, 404, 'Trip not found');
  }

  // Validate driver if being updated
  if (req.body.assignedDriver) {
    const driver = await User.findById(req.body.assignedDriver);
    if (!driver) {
      return sendErrorResponse(res, 400, 'Assigned driver not found');
    }
    if (driver.role !== 'driver') {
      return sendErrorResponse(res, 400, 'Assigned user must be a driver');
    }
  }

  // Validate vehicle if being updated
  if (req.body.assignedVehicle) {
    const vehicle = await Vehicle.findById(req.body.assignedVehicle);
    if (!vehicle) {
      return sendErrorResponse(res, 400, 'Assigned vehicle not found');
    }
  }

  const updatedTrip = await Trip.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate');

  sendSuccessResponse(res, 200, 'Trip updated successfully', { trip: updatedTrip });
});

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private/Admin only
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return sendErrorResponse(res, 404, 'Trip not found');
  }

  await Trip.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 200, 'Trip deleted successfully');
});

// @desc    Start trip
// @route   PUT /api/trips/:id/start
// @access  Private/Assigned driver only
const startTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return sendErrorResponse(res, 404, 'Trip not found');
  }

  // Check if user is the assigned driver
  if (trip.assignedDriver.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Only the assigned driver can start this trip');
  }

  if (trip.status !== 'scheduled') {
    return sendErrorResponse(res, 400, 'Trip must be in scheduled status to start');
  }

  trip.status = 'in_progress';
  trip.actualStartTime = new Date();
  await trip.save();

  const updatedTrip = await Trip.findById(trip._id)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate');

  sendSuccessResponse(res, 200, 'Trip started successfully', { trip: updatedTrip });
});

// @desc    Complete trip
// @route   PUT /api/trips/:id/complete
// @access  Private/Assigned driver only
const completeTrip = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return sendErrorResponse(res, 404, 'Trip not found');
  }

  // Check if user is the assigned driver
  if (trip.assignedDriver.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Only the assigned driver can complete this trip');
  }

  if (trip.status !== 'in_progress') {
    return sendErrorResponse(res, 400, 'Trip must be in progress to complete');
  }

  trip.status = 'completed';
  trip.actualEndTime = new Date();
  if (notes) trip.notes = notes;

  // Calculate actual duration
  if (trip.actualStartTime) {
    trip.actualDuration = Math.round((trip.actualEndTime - trip.actualStartTime) / (1000 * 60)); // in minutes
  }

  await trip.save();

  const updatedTrip = await Trip.findById(trip._id)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate');

  sendSuccessResponse(res, 200, 'Trip completed successfully', { trip: updatedTrip });
});

// @desc    Cancel trip
// @route   PUT /api/trips/:id/cancel
// @access  Private/Admin only
const cancelTrip = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return sendErrorResponse(res, 404, 'Trip not found');
  }

  if (trip.status === 'completed') {
    return sendErrorResponse(res, 400, 'Cannot cancel a completed trip');
  }

  trip.status = 'cancelled';
  if (reason) trip.notes = reason;
  await trip.save();

  const updatedTrip = await Trip.findById(trip._id)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate');

  sendSuccessResponse(res, 200, 'Trip cancelled successfully', { trip: updatedTrip });
});

// @desc    Get trips by status
// @route   GET /api/trips/status/:status
// @access  Private/Admin
const getTripsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page, limit } = req.query;
  const pagination = getPaginationOptions(page, limit);

  const filter = { status };

  // Scope to admin's drivers
  if (req.user.role === 'admin') {
    const adminDrivers = await User.find({ adminId: req.user._id }).distinct('_id');
    filter.assignedDriver = { $in: adminDrivers };
  }

  const trips = await Trip.find(filter)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate')
    .sort({ scheduledStartTime: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Trip.countDocuments(filter);

  sendPaginatedResponse(res, 200, `Trips with status ${status} retrieved successfully`, trips, {
    ...pagination,
    total
  });
});

// @desc    Get driver's trips
// @route   GET /api/trips/driver/:driverId
// @access  Private/Admin or driver themselves
const getDriverTrips = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { page, limit, status } = req.query;
  const pagination = getPaginationOptions(page, limit);

  // Check if user can access this driver's trips
  if (req.user.role !== 'admin' && req.user._id.toString() !== driverId) {
    return sendErrorResponse(res, 403, 'Not authorized to access this driver\'s trips');
  }

  const filter = { assignedDriver: driverId };
  if (status) filter.status = status;

  const trips = await Trip.find(filter)
    .populate('assignedDriver', 'name email phone licenseNumber')
    .populate('assignedVehicle', 'make model year licensePlate')
    .sort({ scheduledStartTime: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Trip.countDocuments(filter);

  sendPaginatedResponse(res, 200, 'Driver trips retrieved successfully', trips, {
    ...pagination,
    total
  });
});

// @desc    Update trip status
// @route   PUT /api/trips/:id/status
// @access  Private/Driver (their trips only) or Admin (any trip)
const updateTripStatus = asyncHandler(async (req, res) => {
  const { status, actualStartTime, actualEndTime, notes } = req.body;
  const tripId = req.params.id;

  // Find the trip
  const trip = await Trip.findById(tripId)
    .populate('assignedDriver', 'name email phone')
    .populate('assignedVehicle', 'make model year licensePlate');

  if (!trip) {
    return sendErrorResponse(res, 404, 'Trip not found');
  }

  // Check permissions - drivers can only update their own trips
  if (req.user.role === 'driver' && trip.assignedDriver._id.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Not authorized to update this trip');
  }

  // Validate status transitions
  const validTransitions = {
    'scheduled': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [], // No transitions from completed
    'cancelled': [], // No transitions from cancelled
    'delayed': ['in_progress', 'cancelled']
  };

  const currentStatus = trip.status;
  const allowedStatuses = validTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(status)) {
    return sendErrorResponse(res, 400, `Invalid status transition from '${currentStatus}' to '${status}'. Allowed transitions: ${allowedStatuses.join(', ')}`);
  }

  // Business logic for status updates
  const updateData = { status };

  // Handle actualStartTime
  if (actualStartTime) {
    if (status === 'in_progress' && !trip.actualStartTime) {
      updateData.actualStartTime = new Date(actualStartTime);
    } else if (status !== 'in_progress') {
      return sendErrorResponse(res, 400, 'actualStartTime can only be set when status is in_progress');
    }
  }

  // Handle actualEndTime
  if (actualEndTime) {
    if (status === 'completed' && !trip.actualEndTime) {
      updateData.actualEndTime = new Date(actualEndTime);
    } else if (status !== 'completed') {
      return sendErrorResponse(res, 400, 'actualEndTime can only be set when status is completed');
    }
  }

  // Handle notes
  if (notes) {
    updateData.notes = notes;
  }

  // Calculate actual duration if both start and end times are provided
  if (updateData.actualStartTime && updateData.actualEndTime) {
    const startTime = updateData.actualStartTime;
    const endTime = updateData.actualEndTime;
    updateData.actualDuration = Math.round((endTime - startTime) / (1000 * 60)); // in minutes
  } else if (trip.actualStartTime && updateData.actualEndTime) {
    const startTime = trip.actualStartTime;
    const endTime = updateData.actualEndTime;
    updateData.actualDuration = Math.round((endTime - startTime) / (1000 * 60)); // in minutes
  }

  // Update the trip
  const updatedTrip = await Trip.findByIdAndUpdate(
    tripId,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('assignedDriver', 'name email phone')
    .populate('assignedVehicle', 'make model year licensePlate');

  sendSuccessResponse(res, 200, 'Trip status updated successfully', { trip: updatedTrip });
});

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  getTripsByStatus,
  getDriverTrips,
  updateTripStatus
};
