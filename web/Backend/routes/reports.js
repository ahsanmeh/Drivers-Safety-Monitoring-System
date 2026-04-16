const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getIncidentsPerDriver,
  getTripsPerVehicleDriver,
  getVehicleStatusReport,
  getDriverPerformance,
  getMonthlyTrends
} = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// Dashboard and analytics routes
router.get('/dashboard', getDashboardStats);
router.get('/incidents-per-driver', getIncidentsPerDriver);
router.get('/trips-per-vehicle-driver', getTripsPerVehicleDriver);
router.get('/vehicle-status', getVehicleStatusReport);
router.get('/driver-performance', getDriverPerformance);
router.get('/monthly-trends', getMonthlyTrends);

module.exports = router;
