const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getDrivers
} = require('../controllers/userController');
const { protect, authorize, authorizeResourceAccess } = require('../middlewares/auth');
const { validateUserUpdate, validateObjectId, validatePagination } = require('../middlewares/validation');

// All routes are protected
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), validatePagination, getUsers);
router.get('/drivers', authorize('admin'), validatePagination, getDrivers);
router.delete('/:id', authorize('admin'), validateObjectId('id'), deleteUser);
router.put('/:id/deactivate', authorize('admin'), validateObjectId('id'), deactivateUser);
router.put('/:id/activate', authorize('admin'), validateObjectId('id'), activateUser);

// Admin or resource owner routes
router.get('/:id', validateObjectId('id'), getUser);
router.put('/:id', validateObjectId('id'), validateUserUpdate, updateUser);

module.exports = router;
