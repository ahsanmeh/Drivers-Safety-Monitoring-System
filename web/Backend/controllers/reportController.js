const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Incident = require('../models/Incident');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// @desc    Get dashboard overview statistics
// @route   GET /api/reports/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Get basic counts
  const [
    totalUsers,
    totalDrivers,
    totalAdmins,
    totalVehicles,
    totalTrips,
    totalIncidents,
    activeVehicles,
    activeDrivers,
    completedTrips,
    cancelledTrips,
    pendingTrips,
    inProgressTrips,
    delayedTrips,
    reportedIncidents,
    resolvedIncidents
  ] = await Promise.all([
    User.countDocuments({ ...dateFilter }),
    User.countDocuments({ role: 'driver', ...dateFilter }),
    User.countDocuments({ role: 'admin', ...dateFilter }),
    Vehicle.countDocuments({ ...dateFilter }),
    Trip.countDocuments({ ...dateFilter }),
    Incident.countDocuments({ ...dateFilter }),
    Vehicle.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'driver', isActive: true }),
    Trip.countDocuments({ status: 'completed' }),
    Trip.countDocuments({ status: 'cancelled' }),
    Trip.countDocuments({ status: 'scheduled' }),
    Trip.countDocuments({ status: 'in_progress' }),
    Trip.countDocuments({ status: 'delayed' }),
    Incident.countDocuments({ status: 'reported' }),
    Incident.countDocuments({ status: 'resolved' })
  ]);

  // Calculate completion rate based on ended trips (completed + cancelled)
  const endedTrips = completedTrips + cancelledTrips;
  const completionRate = endedTrips > 0 ? ((completedTrips / endedTrips) * 100).toFixed(2) : 0;

  // Calculate incident rate
  const incidentRate = totalTrips > 0 ? ((totalIncidents / totalTrips) * 100).toFixed(2) : 0;

  const stats = {
    users: {
      total: totalUsers,
      drivers: totalDrivers,
      admins: totalAdmins,
      activeDrivers
    },
    vehicles: {
      total: totalVehicles,
      active: activeVehicles,
      inactive: totalVehicles - activeVehicles
    },
    trips: {
      total: totalTrips,
      completed: completedTrips,
      cancelled: cancelledTrips,
      pending: pendingTrips,
      inProgress: inProgressTrips,
      delayed: delayedTrips,
      endedTrips: endedTrips,
      completionRate: parseFloat(completionRate)
    },
    incidents: {
      total: totalIncidents,
      reported: reportedIncidents,
      resolved: resolvedIncidents,
      incidentRate: parseFloat(incidentRate)
    }
  };

  sendSuccessResponse(res, 200, 'Dashboard statistics retrieved successfully', { stats });
});

// @desc    Get incidents per driver report
// @route   GET /api/reports/incidents-per-driver
// @access  Private/Admin
const getIncidentsPerDriver = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const matchFilter = {};
  if (startDate || endDate) {
    matchFilter.dateTime = {};
    if (startDate) matchFilter.dateTime.$gte = new Date(startDate);
    if (endDate) matchFilter.dateTime.$lte = new Date(endDate);
  }

  const incidentsPerDriver = await Incident.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'driver',
        foreignField: '_id',
        as: 'driverInfo'
      }
    },
    { $unwind: '$driverInfo' },
    {
      $group: {
        _id: '$driver',
        driverName: { $first: '$driverInfo.name' },
        driverEmail: { $first: '$driverInfo.email' },
        totalIncidents: { $sum: 1 },
        criticalIncidents: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        },
        highIncidents: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        },
        mediumIncidents: {
          $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
        },
        lowIncidents: {
          $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] }
        },
        resolvedIncidents: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        pendingIncidents: {
          $sum: { $cond: [{ $eq: ['$status', 'reported'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 1,
        driverName: 1,
        driverEmail: 1,
        totalIncidents: 1,
        criticalIncidents: 1,
        highIncidents: 1,
        mediumIncidents: 1,
        lowIncidents: 1,
        resolvedIncidents: 1,
        pendingIncidents: 1,
        resolutionRate: {
          $cond: [
            { $gt: ['$totalIncidents', 0] },
            { $multiply: [{ $divide: ['$resolvedIncidents', '$totalIncidents'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { totalIncidents: -1 } }
  ]);

  sendSuccessResponse(res, 200, 'Incidents per driver report retrieved successfully', { 
    incidentsPerDriver 
  });
});

// @desc    Get trips per vehicle/driver report
// @route   GET /api/reports/trips-per-vehicle-driver
// @access  Private/Admin
const getTripsPerVehicleDriver = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  const groupByField = groupBy === 'vehicle' ? 'assignedVehicle' : 'assignedDriver';
  
  const matchFilter = {};
  if (startDate || endDate) {
    matchFilter.scheduledStartTime = {};
    if (startDate) matchFilter.scheduledStartTime.$gte = new Date(startDate);
    if (endDate) matchFilter.scheduledStartTime.$lte = new Date(endDate);
  }

  const lookupCollection = groupBy === 'vehicle' ? 'vehicles' : 'users';
  const lookupField = groupBy === 'vehicle' ? 'assignedVehicle' : 'assignedDriver';

  const tripsReport = await Trip.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: lookupCollection,
        localField: lookupField,
        foreignField: '_id',
        as: 'info'
      }
    },
    { $unwind: '$info' },
    {
      $group: {
        _id: `$${groupByField}`,
        name: { 
          $first: groupBy === 'vehicle' 
            ? { $concat: ['$info.make', ' ', '$info.model', ' (', '$info.licensePlate', ')'] }
            : '$info.name'
        },
        totalTrips: { $sum: 1 },
        completedTrips: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressTrips: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        scheduledTrips: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
        },
        cancelledTrips: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalDistance: { $sum: '$distance' },
        avgDuration: { $avg: '$actualDuration' }
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        totalTrips: 1,
        completedTrips: 1,
        inProgressTrips: 1,
        scheduledTrips: 1,
        cancelledTrips: 1,
        totalDistance: 1,
        avgDuration: { $round: ['$avgDuration', 2] },
        completionRate: {
          $cond: [
            { $gt: ['$totalTrips', 0] },
            { $multiply: [{ $divide: ['$completedTrips', '$totalTrips'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { totalTrips: -1 } }
  ]);

  sendSuccessResponse(res, 200, 'Trips report retrieved successfully', { 
    tripsReport,
    groupBy: groupBy || 'driver'
  });
});

// @desc    Get vehicle status report
// @route   GET /api/reports/vehicle-status
// @access  Private/Admin
const getVehicleStatusReport = asyncHandler(async (req, res) => {
  const vehicleStatus = await Vehicle.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'assignedDriver',
        foreignField: '_id',
        as: 'driverInfo'
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        vehicles: {
          $push: {
            _id: '$_id',
            make: '$make',
            model: '$model',
            year: '$year',
            licensePlate: '$licensePlate',
            assignedDriver: { $arrayElemAt: ['$driverInfo', 0] },
            mileage: '$mileage',
            lastServiceDate: '$lastServiceDate',
            nextServiceDate: '$nextServiceDate'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get total vehicles
  const totalVehicles = await Vehicle.countDocuments();

  sendSuccessResponse(res, 200, 'Vehicle status report retrieved successfully', { 
    vehicleStatus,
    totalVehicles
  });
});

// @desc    Get driver performance report
// @route   GET /api/reports/driver-performance
// @access  Private/Admin
const getDriverPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const matchFilter = {};
  if (startDate || endDate) {
    matchFilter.scheduledStartTime = {};
    if (startDate) matchFilter.scheduledStartTime.$gte = new Date(startDate);
    if (endDate) matchFilter.scheduledStartTime.$lte = new Date(endDate);
  }

  const driverPerformance = await Trip.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedDriver',
        foreignField: '_id',
        as: 'driverInfo'
      }
    },
    { $unwind: '$driverInfo' },
    {
      $lookup: {
        from: 'incidents',
        localField: 'assignedDriver',
        foreignField: 'driver',
        as: 'incidents'
      }
    },
    {
      $group: {
        _id: '$assignedDriver',
        driverName: { $first: '$driverInfo.name' },
        driverEmail: { $first: '$driverInfo.email' },
        totalTrips: { $sum: 1 },
        completedTrips: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalDistance: { $sum: '$distance' },
        avgDuration: { $avg: '$actualDuration' },
        totalIncidents: { $sum: { $size: '$incidents' } },
        criticalIncidents: {
          $sum: {
            $size: {
              $filter: {
                input: '$incidents',
                cond: { $eq: ['$$this.severity', 'critical'] }
              }
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        driverName: 1,
        driverEmail: 1,
        totalTrips: 1,
        completedTrips: 1,
        totalDistance: 1,
        avgDuration: { $round: ['$avgDuration', 2] },
        totalIncidents: 1,
        criticalIncidents: 1,
        completionRate: {
          $cond: [
            { $gt: ['$totalTrips', 0] },
            { $multiply: [{ $divide: ['$completedTrips', '$totalTrips'] }, 100] },
            0
          ]
        },
        incidentRate: {
          $cond: [
            { $gt: ['$totalTrips', 0] },
            { $multiply: [{ $divide: ['$totalIncidents', '$totalTrips'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { completionRate: -1 } }
  ]);

  sendSuccessResponse(res, 200, 'Driver performance report retrieved successfully', { 
    driverPerformance 
  });
});

// @desc    Get monthly trends report
// @route   GET /api/reports/monthly-trends
// @access  Private/Admin
const getMonthlyTrends = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  
  const monthlyTrends = await Trip.aggregate([
    {
      $match: {
        scheduledStartTime: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$scheduledStartTime' },
        totalTrips: { $sum: 1 },
        completedTrips: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalDistance: { $sum: '$distance' },
        avgDuration: { $avg: '$actualDuration' }
      }
    },
    {
      $lookup: {
        from: 'incidents',
        let: { month: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: [{ $month: '$dateTime' }, '$$month'] },
                  { $gte: ['$dateTime', new Date(`${currentYear}-01-01`)] },
                  { $lt: ['$dateTime', new Date(`${currentYear + 1}-01-01`)] }
                ]
              }
            }
          }
        ],
        as: 'incidents'
      }
    },
    {
      $project: {
        _id: 1,
        month: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 1] }, then: 'January' },
              { case: { $eq: ['$_id', 2] }, then: 'February' },
              { case: { $eq: ['$_id', 3] }, then: 'March' },
              { case: { $eq: ['$_id', 4] }, then: 'April' },
              { case: { $eq: ['$_id', 5] }, then: 'May' },
              { case: { $eq: ['$_id', 6] }, then: 'June' },
              { case: { $eq: ['$_id', 7] }, then: 'July' },
              { case: { $eq: ['$_id', 8] }, then: 'August' },
              { case: { $eq: ['$_id', 9] }, then: 'September' },
              { case: { $eq: ['$_id', 10] }, then: 'October' },
              { case: { $eq: ['$_id', 11] }, then: 'November' },
              { case: { $eq: ['$_id', 12] }, then: 'December' }
            ],
            default: 'Unknown'
          }
        },
        totalTrips: 1,
        completedTrips: 1,
        totalDistance: 1,
        avgDuration: { $round: ['$avgDuration', 2] },
        totalIncidents: { $size: '$incidents' },
        completionRate: {
          $cond: [
            { $gt: ['$totalTrips', 0] },
            { $multiply: [{ $divide: ['$completedTrips', '$totalTrips'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  sendSuccessResponse(res, 200, 'Monthly trends report retrieved successfully', { 
    monthlyTrends,
    year: currentYear
  });
});

module.exports = {
  getDashboardStats,
  getIncidentsPerDriver,
  getTripsPerVehicleDriver,
  getVehicleStatusReport,
  getDriverPerformance,
  getMonthlyTrends
};
