import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiMapPin, 
  FiUser, 
  FiTruck, 
  FiClock, 
  FiCalendar,
  FiDollarSign,
  FiMessageSquare,
  FiNavigation
} from 'react-icons/fi';

const TripDetailModal = ({ isOpen, onClose, trip }) => {
  if (!trip) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (distance) => {
    return distance ? `${distance} km` : 'N/A';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <FiNavigation className="w-6 h-6 mr-3 text-blue-600" />
                Trip Details: {trip.tripNumber || 'N/A'}
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FiX className="w-7 h-7" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Trip Info */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Distance</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDistance(trip.distance)}</p>
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FiUser className="w-5 h-5 mr-2" /> Driver & Vehicle
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {trip.assignedDriver && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Driver</p>
                      <p className="font-semibold text-gray-900">{trip.assignedDriver.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{trip.assignedDriver.email || 'N/A'}</p>
                    </div>
                  )}
                  {trip.assignedVehicle && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vehicle</p>
                      <p className="font-semibold text-gray-900">
                        {trip.assignedVehicle.make || 'N/A'} {trip.assignedVehicle.model || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">License: {trip.assignedVehicle.licensePlate || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Route Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FiMapPin className="w-5 h-5 mr-2" /> Route Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Start Location</p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900">{trip.startLocation?.address || 'N/A'}</p>
                      {trip.startLocation?.coordinates && (
                        <p className="text-sm text-gray-600 mt-1">
                          Lat: {trip.startLocation.coordinates.latitude?.toFixed(6) || 'N/A'}, 
                          Long: {trip.startLocation.coordinates.longitude?.toFixed(6) || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">End Location</p>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900">{trip.endLocation?.address || 'N/A'}</p>
                      {trip.endLocation?.coordinates && (
                        <p className="text-sm text-gray-600 mt-1">
                          Lat: {trip.endLocation.coordinates.latitude?.toFixed(6) || 'N/A'}, 
                          Long: {trip.endLocation.coordinates.longitude?.toFixed(6) || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FiClock className="w-5 h-5 mr-2" /> Schedule
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scheduled Start</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(trip.scheduledStartTime || trip.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scheduled End</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(trip.scheduledEndTime || trip.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estimated Duration</p>
                    <p className="font-semibold text-gray-900">{formatDuration(trip.estimatedDuration)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actual Duration</p>
                    <p className="font-semibold text-gray-900">{formatDuration(trip.actualDuration)}</p>
                  </div>
                </div>
              </div>

              {/* Actual Times (if trip is completed) */}
              {(trip.actualStartTime || trip.actualEndTime) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiCalendar className="w-5 h-5 mr-2" /> Actual Times
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {trip.actualStartTime && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Actual Start</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(trip.actualStartTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {trip.actualEndTime && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Actual End</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(trip.actualEndTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Notes */}
              {trip.notes && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FiMessageSquare className="w-5 h-5 mr-2" /> Notes
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800">{trip.notes}</p>
                  </div>
                </div>
              )}

              {/* Trip Metadata */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FiDollarSign className="w-5 h-5 mr-2" /> Trip Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-gray-800">{new Date(trip.createdAt).toLocaleString()}</p>
                  </div>
                  {trip.updatedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-gray-800">{new Date(trip.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {trip.fare && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fare</p>
                      <p className="text-lg font-semibold text-gray-900">Rs. {trip.fare}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TripDetailModal;
