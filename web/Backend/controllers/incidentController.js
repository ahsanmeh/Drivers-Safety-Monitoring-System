const Incident = require('../models/Incident');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { sendSuccessResponse, sendErrorResponse, getPaginationOptions, sendPaginatedResponse } = require('../utils/responseHandler');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// Helper function to generate incident number
const generateIncidentNumber = async () => {
  const count = await Incident.countDocuments();
  return `INC${String(count + 1).padStart(6, '0')}`;
};

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private/Admin (all incidents) or Driver (their incidents only)
const getIncidents = asyncHandler(async (req, res) => {
  const { page, limit = 100, status, severity, incidentType, driver, vehicle } = req.query;
  const pagination = getPaginationOptions(page, limit);

  // Build filter object
  const filter = {};

  // Drivers can only see their own incidents
  if (req.user.role === 'driver') {
    filter.driver = req.user._id;
    filter.hiddenFromDriver = { $ne: true };
  } else if (req.user.role === 'admin') {
    // Admin can only see incidents for their drivers
    const adminDrivers = await User.find({ adminId: req.user._id }).distinct('_id');

    // If specific driver requested, ensure they belong to admin
    if (driver) {
      if (adminDrivers.map(id => id.toString()).includes(driver)) {
        filter.driver = driver;
      } else {
        // Requested driver doesn't belong to admin -> return no results
        filter.driver = null;
      }
    } else {
      // Otherwise show all incidents for admin's drivers
      filter.driver = { $in: adminDrivers };
    }

    if (vehicle) filter.vehicle = vehicle;
  }

  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (incidentType) filter.incidentType = incidentType;

  const incidents = await Incident.find(filter)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation')
    .sort({ dateTime: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Incident.countDocuments(filter);

  sendPaginatedResponse(res, 200, 'Incidents retrieved successfully', incidents, {
    ...pagination,
    total
  });
});

// @desc    Get incident by ID
// @route   GET /api/incidents/:id
// @access  Private/Admin or incident driver
const getIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate color')
    .populate('trip', 'tripNumber startLocation endLocation scheduledStartTime')
    .populate('resolvedBy', 'name email');

  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  // Check if user can access this incident
  if (req.user.role !== 'admin' &&
    incident.driver._id.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, 403, 'Not authorized to access this incident');
  }

  sendSuccessResponse(res, 200, 'Incident retrieved successfully', { incident });
});

// @desc    Create incident
// @route   POST /api/incidents
// @access  Private/Driver or Admin
const createIncident = asyncHandler(async (req, res) => {
  const {
    driver,
    vehicle,
    trip,
    incidentType,
    severity,
    location,
    description,
    witnessDetails,
    damageDetails,
    policeReport,
    insurance,
    questions
  } = req.body;

  // Validate driver exists and is a driver
  const driverUser = await User.findById(driver);
  if (!driverUser) {
    return sendErrorResponse(res, 400, 'Driver not found');
  }
  if (driverUser.role !== 'driver') {
    return sendErrorResponse(res, 400, 'User must be a driver');
  }

  // Validate vehicle exists
  const vehicleDoc = await Vehicle.findById(vehicle);
  if (!vehicleDoc) {
    return sendErrorResponse(res, 400, 'Vehicle not found');
  }

  // Validate trip if provided
  if (trip) {
    const tripDoc = await Trip.findById(trip);
    if (!tripDoc) {
      return sendErrorResponse(res, 400, 'Trip not found');
    }
  }

  // Generate incident number
  const incidentNumber = await generateIncidentNumber();

  const incident = await Incident.create({
    incidentNumber,
    reportedBy: req.user._id,
    driver,
    vehicle,
    trip,
    incidentType,
    severity,
    location,
    description,
    witnessDetails,
    damageDetails,
    policeReport,
    insurance,
    questions: questions || []
  });

  const populatedIncident = await Incident.findById(incident._id)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation');

  sendSuccessResponse(res, 201, 'Incident reported successfully', { incident: populatedIncident });
});

// @desc    Update incident
// @route   PUT /api/incidents/:id
// @access  Private/Admin only
const updateIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  // Validate driver if being updated
  if (req.body.driver) {
    const driver = await User.findById(req.body.driver);
    if (!driver) {
      return sendErrorResponse(res, 400, 'Driver not found');
    }
    if (driver.role !== 'driver') {
      return sendErrorResponse(res, 400, 'User must be a driver');
    }
  }

  // Validate vehicle if being updated
  if (req.body.vehicle) {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) {
      return sendErrorResponse(res, 400, 'Vehicle not found');
    }
  }

  // Validate trip if being updated
  if (req.body.trip) {
    const trip = await Trip.findById(req.body.trip);
    if (!trip) {
      return sendErrorResponse(res, 400, 'Trip not found');
    }
  }

  const updatedIncident = await Incident.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation')
    .populate('resolvedBy', 'name email');

  sendSuccessResponse(res, 200, 'Incident updated successfully', { incident: updatedIncident });
});

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private/Admin only
const deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  await Incident.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 200, 'Incident deleted successfully');
});

// @desc    Resolve incident
// @route   PUT /api/incidents/:id/resolve
// @access  Private/Admin only
const resolveIncident = asyncHandler(async (req, res) => {
  const { resolution } = req.body;
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  incident.status = 'resolved';
  incident.resolution = resolution;
  incident.resolvedBy = req.user._id;
  incident.resolvedAt = new Date();
  await incident.save();

  const updatedIncident = await Incident.findById(incident._id)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation')
    .populate('resolvedBy', 'name email');

  sendSuccessResponse(res, 200, 'Incident resolved successfully', { incident: updatedIncident });
});

// @desc    Close incident
// @route   PUT /api/incidents/:id/close
// @access  Private/Admin only
const closeIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  if (incident.status !== 'resolved') {
    return sendErrorResponse(res, 400, 'Incident must be resolved before closing');
  }

  incident.status = 'closed';
  await incident.save();

  const updatedIncident = await Incident.findById(incident._id)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation')
    .populate('resolvedBy', 'name email');

  sendSuccessResponse(res, 200, 'Incident closed successfully', { incident: updatedIncident });
});

// @desc    Get incidents by status
// @route   GET /api/incidents/status/:status
// @access  Private/Admin
const getIncidentsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page, limit } = req.query;
  const pagination = getPaginationOptions(page, limit);

  const filter = { status };

  // Scope to admin's drivers
  if (req.user.role === 'admin') {
    const adminDrivers = await User.find({ adminId: req.user._id }).distinct('_id');
    filter.driver = { $in: adminDrivers };
  }

  const incidents = await Incident.find(filter)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation')
    .sort({ dateTime: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Incident.countDocuments(filter);

  sendPaginatedResponse(res, 200, `Incidents with status ${status} retrieved successfully`, incidents, {
    ...pagination,
    total
  });
});

// @desc    Get incidents by severity
// @route   GET /api/incidents/severity/:severity
// @access  Private/Admin
const getIncidentsBySeverity = asyncHandler(async (req, res) => {
  const { severity } = req.params;
  const { page, limit } = req.query;
  const pagination = getPaginationOptions(page, limit);

  const filter = { severity };

  // Scope to admin's drivers
  if (req.user.role === 'admin') {
    const adminDrivers = await User.find({ adminId: req.user._id }).distinct('_id');
    filter.driver = { $in: adminDrivers };
  }

  const incidents = await Incident.find(filter)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation')
    .sort({ dateTime: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Incident.countDocuments(filter);

  sendPaginatedResponse(res, 200, `Incidents with severity ${severity} retrieved successfully`, incidents, {
    ...pagination,
    total
  });
});

// @desc    Get driver's incidents
// @route   GET /api/incidents/driver/:driverId
// @access  Private/Admin or driver themselves
const getDriverIncidents = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { page, limit, status, severity } = req.query;
  const pagination = getPaginationOptions(page, limit);

  // Check if user can access this driver's incidents
  if (req.user.role !== 'admin' && req.user._id.toString() !== driverId) {
    return sendErrorResponse(res, 403, 'Not authorized to access this driver\'s incidents');
  }

  const filter = { driver: driverId };
  if (status) filter.status = status;
  if (severity) filter.severity = severity;

  // Filter out hidden incidents for driver
  // Admins can see all, but let's hide dismissed ones if we want, or keep them visible for admin?
  // Let's assume admins should see everything, but the app (driver view) calls this endpoint mostly.
  // Actually, if a driver calls this, they shouldn't see hidden ones.


  const incidents = await Incident.find(filter)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation')
    .sort({ dateTime: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await Incident.countDocuments(filter);

  sendPaginatedResponse(res, 200, 'Driver incidents retrieved successfully', incidents, {
    ...pagination,
    total
  });
});

// @desc    Answer incident questions
// @route   PUT /api/incidents/:id/answer-questions
// @access  Private/Driver (can answer questions for their incidents)
const answerQuestions = asyncHandler(async (req, res) => {
  const { answers } = req.body; // Array of { questionIndex, answer }

  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  // Check if user is the driver of this incident
  if (req.user.role === 'driver' && incident.driver.toString() !== req.user._id.toString()) {
    console.log(`🚫 Auth Failure in answerQuestions:`);
    console.log(`   - Incident ID: ${req.params.id}`);
    console.log(`   - Incident Driver: ${incident.driver}`);
    console.log(`   - Requesting User: ${req.user._id}`);
    return sendErrorResponse(res, 403, 'Not authorized to answer questions for this incident');
  }

  // Validate answers format
  if (!Array.isArray(answers)) {
    return sendErrorResponse(res, 400, 'Answers must be an array');
  }

  // Update answers
  answers.forEach(({ questionIndex, answer }) => {
    if (incident.questions[questionIndex]) {
      // Only update if answer is provided and not empty
      if (answer && answer.trim()) {
        incident.questions[questionIndex].answer = answer.trim();
        incident.questions[questionIndex].answeredAt = new Date();
      } else {
        // Clear answer if empty string provided
        incident.questions[questionIndex].answer = '';
        incident.questions[questionIndex].answeredAt = null;
      }
    }
  });

  await incident.save();

  const populatedIncident = await Incident.findById(incident._id)
    .populate('reportedBy', 'name email phone')
    .populate('driver', 'name email phone licenseNumber')
    .populate('vehicle', 'make model year licensePlate')
    .populate('trip', 'tripNumber startLocation endLocation');

  sendSuccessResponse(res, 200, 'Questions answered successfully', { incident: populatedIncident });
});

// @desc    Update incident location
// @route   PUT /api/incidents/:id/location
// @access  Private/Driver or Admin
const updateIncidentLocation = asyncHandler(async (req, res) => {
  const { location } = req.body;

  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  // Check if user is authorized (Admin or the driver of the incident)
  if (req.user.role !== 'admin' && incident.driver.toString() !== req.user._id.toString()) {
    console.log(`🚫 Auth Failure in updateIncidentLocation:`);
    console.log(`   - Incident ID: ${req.params.id}`);
    console.log(`   - Incident Driver: ${incident.driver}`);
    console.log(`   - Requesting User: ${req.user._id} (${req.user.role})`);
    return sendErrorResponse(res, 403, 'Not authorized to update this incident');
  }

  if (!location || !location.coordinates) {
    return sendErrorResponse(res, 400, 'Invalid location data');
  }

  incident.location = location;
  await incident.save();

  sendSuccessResponse(res, 200, 'Incident location updated successfully', { incident });
});

// @desc    Dismiss incident (hide from driver)
// @route   PUT /api/incidents/:id/dismiss
// @access  Private/Driver
const dismissIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return sendErrorResponse(res, 404, 'Incident not found');
  }

  // Check authorization
  if (req.user.role !== 'admin' && incident.driver.toString() !== req.user._id.toString()) {
    console.log(`🚫 Auth Failure in dismissIncident:`);
    console.log(`   - Incident ID: ${req.params.id}`);
    console.log(`   - Incident Driver: ${incident.driver}`);
    console.log(`   - Requesting User: ${req.user._id}`);
    return sendErrorResponse(res, 403, 'Not authorized to dismiss this incident');
  }

  incident.hiddenFromDriver = true;
  await incident.save();

  sendSuccessResponse(res, 200, 'Incident dismissed successfully');
});

module.exports = {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  resolveIncident,
  closeIncident,
  getIncidentsByStatus,
  getIncidentsBySeverity,
  getDriverIncidents,
  answerQuestions,
  getDriverIncidents,
  answerQuestions,
  updateIncidentLocation,
  dismissIncident
};
