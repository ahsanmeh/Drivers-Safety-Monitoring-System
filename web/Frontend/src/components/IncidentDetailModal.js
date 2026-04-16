import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiAlertTriangle, 
  FiUser, 
  FiTruck, 
  FiMapPin, 
  FiCalendar, 
  FiClock,
  FiFileText,
  FiEye,
  FiPhone,
  FiMail
} from 'react-icons/fi';

const IncidentDetailModal = ({ isOpen, onClose, incident }) => {
  if (!incident) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Incident #{incident.incidentNumber || incident._id}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(incident.dateTime || incident.createdAt).toLocaleDateString()} at{' '}
                    {new Date(incident.dateTime || incident.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status and Severity */}
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getSeverityColor(incident.severity)}`}>
                  {incident.severity?.toUpperCase() || 'UNKNOWN'}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(incident.status)}`}>
                  {incident.status?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              {/* Incident Type and Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <FiAlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  {incident.incidentType?.replace('_', ' ').toUpperCase() || incident.type?.toUpperCase() || 'INCIDENT'}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {incident.description || 'No description provided'}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Driver Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FiUser className="w-5 h-5 mr-2 text-blue-600" />
                    Driver Information
                  </h4>
                  <div className="space-y-2">
                    <p><span className="font-medium text-gray-700">Name:</span> {incident.driver?.name || 'Unknown'}</p>
                    <p><span className="font-medium text-gray-700">Email:</span> {incident.driver?.email || 'N/A'}</p>
                    {incident.reportedBy && incident.reportedBy.name && (
                      <p><span className="font-medium text-gray-700">Reported by:</span> {incident.reportedBy.name}</p>
                    )}
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FiTruck className="w-5 h-5 mr-2 text-green-600" />
                    Vehicle Information
                  </h4>
                  <div className="space-y-2">
                    <p><span className="font-medium text-gray-700">Vehicle:</span> {incident.vehicle?.make || 'Unknown'} {incident.vehicle?.model || ''}</p>
                    <p><span className="font-medium text-gray-700">License Plate:</span> {incident.vehicle?.licensePlate || 'N/A'}</p>
                    {incident.vehicle?.year && (
                      <p><span className="font-medium text-gray-700">Year:</span> {incident.vehicle.year}</p>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FiMapPin className="w-5 h-5 mr-2 text-red-600" />
                    Location Information
                  </h4>
                  <div className="space-y-2">
                    <p><span className="font-medium text-gray-700">Address:</span> {incident.location?.address || 'Not specified'}</p>
                    {incident.location?.coordinates && (
                      <div>
                        <p><span className="font-medium text-gray-700">Coordinates:</span></p>
                        <p className="text-sm text-gray-600 ml-4">
                          Lat: {incident.location.coordinates.latitude}, 
                          Lng: {incident.location.coordinates.longitude}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Information */}
                {incident.trip && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FiFileText className="w-5 h-5 mr-2 text-purple-600" />
                      Related Trip
                    </h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700">Trip Number:</span> {incident.trip.tripNumber || incident.trip._id}</p>
                      {incident.trip.startLocation && (
                        <p><span className="font-medium text-gray-700">From:</span> {incident.trip.startLocation.address || 'Unknown'}</p>
                      )}
                      {incident.trip.endLocation && (
                        <p><span className="font-medium text-gray-700">To:</span> {incident.trip.endLocation.address || 'Unknown'}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Witness Details */}
              {incident.witnessDetails && incident.witnessDetails.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FiEye className="w-5 h-5 mr-2 text-blue-600" />
                    Witness Details
                  </h4>
                  <div className="space-y-4">
                    {incident.witnessDetails.map((witness, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium text-gray-700">Name</p>
                            <p className="text-gray-900">{witness.name || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Phone</p>
                            <p className="text-gray-900">{witness.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Statement</p>
                            <p className="text-gray-900">{witness.statement || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Damage Details */}
              {incident.damageDetails && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FiFileText className="w-5 h-5 mr-2 text-orange-600" />
                    Damage Assessment
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">Vehicle Damage</p>
                      <p className="text-gray-900">{incident.damageDetails.vehicleDamage || 'None reported'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Cargo Damage</p>
                      <p className="text-gray-900">{incident.damageDetails.cargoDamage || 'None reported'}</p>
                    </div>
                    {incident.damageDetails.estimatedCost && (
                      <div className="md:col-span-2">
                        <p className="font-medium text-gray-700">Estimated Cost</p>
                        <p className="text-gray-900">${incident.damageDetails.estimatedCost}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Police Report */}
              {incident.policeReport && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FiFileText className="w-5 h-5 mr-2 text-blue-600" />
                    Police Report
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">Report Number</p>
                      <p className="text-gray-900">{incident.policeReport.reportNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Officer Name</p>
                      <p className="text-gray-900">{incident.policeReport.officerName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Station</p>
                      <p className="text-gray-900">{incident.policeReport.station || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions & Answers Section */}
              {incident.questions && incident.questions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FiFileText className="w-5 h-5 mr-2 text-green-600" />
                    Questions & Answers
                  </h4>
                  <div className="space-y-4">
                    {incident.questions.map((qa, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="question mb-2">
                          <div className="flex items-center">
                            <strong className="text-gray-900">Q{index + 1}:</strong>
                            <span className="ml-2 text-gray-900">{qa.question}</span>
                            {qa.isRequired && (
                              <span className="ml-2 text-red-600 text-sm font-medium">*</span>
                            )}
                          </div>
                        </div>
                        <div className="answer">
                          {qa.answer ? (
                            <div>
                              <strong className="text-gray-700">Answer:</strong>
                              <p className="text-gray-900 mt-1">{qa.answer}</p>
                              {qa.answeredAt && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Answered: {new Date(qa.answeredAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">No answer provided</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default IncidentDetailModal;
