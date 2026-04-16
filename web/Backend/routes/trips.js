const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/tripController');
const { protect, authorize } = require('../middlewares/auth');
const { validateTrip, validateTripStatusUpdate, validateObjectId, validatePagination } = require('../middlewares/validation');

// All routes are protected
router.use(protect);

// Admin only routes
router.post('/', authorize('admin'), validateTrip, createTrip);
router.put('/:id', authorize('admin'), validateObjectId('id'), updateTrip);
router.delete('/:id', authorize('admin'), validateObjectId('id'), deleteTrip);
router.put('/:id/cancel', authorize('admin'), validateObjectId('id'), cancelTrip);
router.get('/status/:status', authorize('admin'), validatePagination, getTripsByStatus);

// Driver routes (for their own trips)
router.put('/:id/start', validateObjectId('id'), startTrip);
router.put('/:id/complete', validateObjectId('id'), completeTrip);
router.put('/:id/status', validateObjectId('id'), validateTripStatusUpdate, updateTripStatus);

// Admin or driver routes
router.get('/', validatePagination, getTrips);
router.get('/:id', validateObjectId('id'), getTrip);
router.get('/driver/:driverId', validateObjectId('driverId'), validatePagination, getDriverTrips);

module.exports = router;
