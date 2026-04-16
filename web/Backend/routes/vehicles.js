const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignVehicle,
  unassignVehicle,
  getVehiclesByStatus,
  getDriverVehicles
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middlewares/auth');
const { validateVehicle, validateObjectId, validatePagination } = require('../middlewares/validation');

// All routes are protected
router.use(protect);

// Admin or driver routes (drivers see only their assigned vehicles)
router.get('/', validatePagination, getVehicles);
router.post('/', authorize('admin'), validateVehicle, createVehicle);
router.put('/:id', authorize('admin'), validateObjectId('id'), updateVehicle);
router.delete('/:id', authorize('admin'), validateObjectId('id'), deleteVehicle);
router.put('/:id/assign', authorize('admin'), validateObjectId('id'), assignVehicle);
router.put('/:id/unassign', authorize('admin'), validateObjectId('id'), unassignVehicle);
router.get('/status/:status', authorize('admin'), validatePagination, getVehiclesByStatus);

// Admin or driver routes
router.get('/:id', validateObjectId('id'), getVehicle);
router.get('/driver/:driverId', validateObjectId('driverId'), validatePagination, getDriverVehicles);

module.exports = router;
