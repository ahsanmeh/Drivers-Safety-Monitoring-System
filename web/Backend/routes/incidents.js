const express = require('express');
const router = express.Router();
const {
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
  updateIncidentLocation,
  dismissIncident
} = require('../controllers/incidentController');
const { protect, authorize } = require('../middlewares/auth');
const { validateIncident, validateAnswerQuestions, validateObjectId, validatePagination } = require('../middlewares/validation');

// All routes are protected
router.use(protect);

// Admin only routes
router.put('/:id', authorize('admin'), validateObjectId('id'), updateIncident);
router.delete('/:id', authorize('admin'), validateObjectId('id'), deleteIncident);
router.put('/:id/resolve', authorize('admin'), validateObjectId('id'), resolveIncident);
router.put('/:id/close', authorize('admin'), validateObjectId('id'), closeIncident);
router.get('/status/:status', authorize('admin'), validatePagination, getIncidentsByStatus);
router.get('/severity/:severity', authorize('admin'), validatePagination, getIncidentsBySeverity);

// Driver and Admin routes
router.post('/', validateIncident, createIncident);

// Driver routes (can answer questions for their incidents)
router.put('/:id/answer-questions', validateObjectId('id'), validateAnswerQuestions, answerQuestions);
router.put('/:id/location', validateObjectId('id'), updateIncidentLocation);
router.put('/:id/dismiss', validateObjectId('id'), dismissIncident);

// Admin or driver routes
router.get('/', validatePagination, getIncidents);
router.get('/:id', validateObjectId('id'), getIncident);
router.get('/driver/:driverId', validateObjectId('driverId'), validatePagination, getDriverIncidents);

module.exports = router;
