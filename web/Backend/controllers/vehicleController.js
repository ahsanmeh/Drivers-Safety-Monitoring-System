const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Trip = require('../models/Trip');
const { sendSuccessResponse, sendErrorResponse, getPaginationOptions, sendPaginatedResponse } = require('../utils/responseHandler');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private/Admin or Driver (drivers see vehicles they've used in trips)
const getVehicles = asyncHandler(async (req, res) => {
  const { page, limit, status, assignedDriver } = req.query;
  const pagination = getPaginationOptions(page, limit);

  let vehicles;
  let total;

  if (req.user.role === 'driver') {
    // For drivers: Get vehicles they've used in trips OR are currently assigned to them
    const driverTrips = await Trip.find({ assignedDriver: req.user._id }).select('assignedVehicle');
    const vehicleIds = [...new Set(driverTrips.map(trip => trip.assignedVehicle.toString()))];

    const filter = {
      $or: [
        { _id: { $in: vehicleIds } },
        { assignedDriver: req.user._id }
      ]
    };

    if (status) filter.status = status;

    vehicles = await Vehicle.find(filter)
      .populate('assignedDriver', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    total = await Vehicle.countDocuments(filter);
  } else {
    // For admins: Get all vehicles with optional filters
    const filter = {};
    if (status) filter.status = status;
    if (assignedDriver) filter.assignedDriver = assignedDriver;

    // Scope to admin's vehicles
    if (req.user.role === 'admin') {
      filter.adminId = req.user._id;
    }

    vehicles = await Vehicle.find(filter)
      .populate('assignedDriver', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    total = await Vehicle.countDocuments(filter);
  }

  sendPaginatedResponse(res, 200, 'Vehicles retrieved successfully', vehicles, {
    ...pagination,
    total
  });
});

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private/Admin or driver who has used this vehicle in trips
const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('assignedDriver', 'name email phone licenseNumber');

  if (!vehicle) {
    return sendErrorResponse(res, 404, 'Vehicle not found');
  }

  // Check if user can access this vehicle
  if (req.user.role === 'driver') {
    // For drivers: Check if they've used this vehicle in any trip
    const hasUsedVehicle = await Trip.findOne({
      assignedDriver: req.user._id,
      assignedVehicle: req.params.id
    });

    if (!hasUsedVehicle) {
      return sendErrorResponse(res, 403, 'Not authorized to access this vehicle');
    }
  } else if (req.user.role === 'admin') {
    // For admins: Check if they own the vehicle
    if (vehicle.adminId && vehicle.adminId.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 403, 'Not authorized to access this vehicle');
    }
  }

  sendSuccessResponse(res, 200, 'Vehicle retrieved successfully', { vehicle });
});

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private/Admin only
const createVehicle = asyncHandler(async (req, res) => {
  const {
    make,
    model,
    year,
    licensePlate,
    vin,
    color,
    assignedDriver,
    status,
    mileage,
    lastServiceDate,
    nextServiceDate,
    insuranceExpiry,
    registrationExpiry,
    sensorMacAddress
  } = req.body;

  // Check for duplicate license plate
  const existingVehicle = await Vehicle.findOne({ licensePlate });
  if (existingVehicle) {
    return sendErrorResponse(res, 400, 'Vehicle with this license plate already exists');
  }

  // Check if assigned driver exists and is a driver
  if (assignedDriver) {
    const driver = await User.findById(assignedDriver);
    if (!driver) {
      return sendErrorResponse(res, 400, 'Assigned driver not found');
    }
    if (driver.role !== 'driver') {
      return sendErrorResponse(res, 400, 'Assigned user must be a driver');
    }
    // Ensure driver belongs to this admin
    if (req.user.role === 'admin' && driver.adminId && driver.adminId.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 400, 'Cannot assign a driver that belongs to another admin');
    }
  }

  const vehicleData = {
    make,
    model,
    year,
    licensePlate,
    vin,
    color,
    assignedDriver,
    status,
    mileage,
    lastServiceDate,
    nextServiceDate,
    insuranceExpiry,
    registrationExpiry,
    sensorMacAddress
  };

  // Assign adminId if user is admin
  if (req.user.role === 'admin') {
    vehicleData.adminId = req.user._id;
  }

  const vehicle = await Vehicle.create(vehicleData);

  const populatedVehicle = await Vehicle.findById(vehicle._id)
    .populate('assignedDriver', 'name email phone');

  sendSuccessResponse(res, 201, 'Vehicle created successfully', { vehicle: populatedVehicle });
});

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Admin only
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return sendErrorResponse(res, 404, 'Vehicle not found');
  }

  // Check ownership
  if (req.user.role === 'admin' && vehicle.adminId && vehicle.adminId.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Not authorized to update this vehicle');
  }

  // Check if assigned driver exists and is a driver
  if (req.body.assignedDriver) {
    const driver = await User.findById(req.body.assignedDriver);
    if (!driver) {
      return sendErrorResponse(res, 400, 'Assigned driver not found');
    }
    if (driver.role !== 'driver') {
      return sendErrorResponse(res, 400, 'Assigned user must be a driver');
    }
  }

  const updatedVehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('assignedDriver', 'name email phone');

  sendSuccessResponse(res, 200, 'Vehicle updated successfully', { vehicle: updatedVehicle });
});

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin only
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return sendErrorResponse(res, 404, 'Vehicle not found');
  }

  // Check ownership
  if (req.user.role === 'admin' && vehicle.adminId && vehicle.adminId.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Not authorized to delete this vehicle');
  }

  await Vehicle.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 200, 'Vehicle deleted successfully');
});

// @desc    Assign vehicle to driver
// @route   PUT /api/vehicles/:id/assign
// @access  Private/Admin only
const assignVehicle = asyncHandler(async (req, res) => {
  const { driverId } = req.body;

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return sendErrorResponse(res, 404, 'Vehicle not found');
  }

  // Check ownership
  if (req.user.role === 'admin' && vehicle.adminId && vehicle.adminId.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Not authorized to assign this vehicle');
  }

  const driver = await User.findById(driverId);
  if (!driver) {
    return sendErrorResponse(res, 400, 'Driver not found');
  }
  if (driver.role !== 'driver') {
    return sendErrorResponse(res, 400, 'User must be a driver');
  }

  vehicle.assignedDriver = driverId;
  await vehicle.save();

  const updatedVehicle = await Vehicle.findById(vehicle._id)
    .populate('assignedDriver', 'name email phone');

  sendSuccessResponse(res, 200, 'Vehicle assigned successfully', { vehicle: updatedVehicle });
});

// @desc    Unassign vehicle from driver
// @route   PUT /api/vehicles/:id/unassign
// @access  Private/Admin only
const unassignVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return sendErrorResponse(res, 404, 'Vehicle not found');
  }

  // Check ownership
  if (req.user.role === 'admin' && vehicle.adminId && vehicle.adminId.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Not authorized to unassign this vehicle');
  }

  vehicle.assignedDriver = null;
  await vehicle.save();

  sendSuccessResponse(res, 200, 'Vehicle unassigned successfully', { vehicle });
});

// @desc    Get vehicles by status
// @route   GET /api/vehicles/status/:status
// @access  Private/Admin
const getVehiclesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page, limit } = req.query;
  const pagination = getPaginationOptions(page, limit);

  const filter = { status };

  // Scope to admin's vehicles
  if (req.user.role === 'admin') {
    filter.adminId = req.user._id;
  }

  const vehicles = await Vehicle.find(filter)
    .populate('assignedDriver', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Vehicle.countDocuments(filter);

  sendPaginatedResponse(res, 200, `Vehicles with status ${status} retrieved successfully`, vehicles, {
    ...pagination,
    total
  });
});

// @desc    Get driver's assigned vehicles
// @route   GET /api/vehicles/driver/:driverId
// @access  Private/Admin or driver themselves
const getDriverVehicles = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { page, limit } = req.query;
  const pagination = getPaginationOptions(page, limit);

  // Check if user can access this driver's vehicles
  if (req.user.role !== 'admin' && req.user._id.toString() !== driverId) {
    return sendErrorResponse(res, 403, 'Not authorized to access this driver\'s vehicles');
  }

  const vehicles = await Vehicle.find({ assignedDriver: driverId })
    .populate('assignedDriver', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Vehicle.countDocuments({ assignedDriver: driverId });

  sendPaginatedResponse(res, 200, 'Driver vehicles retrieved successfully', vehicles, {
    ...pagination,
    total
  });
});

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignVehicle,
  unassignVehicle,
  getVehiclesByStatus,
  getDriverVehicles
};
