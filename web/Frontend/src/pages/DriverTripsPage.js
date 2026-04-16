import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import TripDetailModal from '../components/TripDetailModal';
import { 
  FiHome, 
  FiUser, 
  FiClock, 
  FiAlertTriangle, 
  FiTruck, 
  FiDollarSign, 
  FiFileText,
  FiPlay,
  FiCheckCircle,
  FiEye,
  FiSquare
} from 'react-icons/fi';
import { tripAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { useErrorHandler } from '../hooks/useErrorHandler';

const DriverTripsPage = () => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  const { handleApiError } = useErrorHandler();

  const navigationItems = [
    { name: 'Trips', icon: FiClock, path: '/driver-dashboard/trips' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/driver-dashboard/incidents' },
    { name: 'Vehicles', icon: FiTruck, path: '/driver-dashboard/vehicles' },
    { name: 'Profile', icon: FiUser, path: '/driver-dashboard/profile' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Call fetchTrips after user is set
      fetchTrips(parsedUser);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const fetchTrips = async (userData = user) => {
    if (!userData) return;
    
    try {
      setLoading(true);
      console.log('Fetching trips for user:', userData._id);
      // Get trips assigned to current driver with pagination
      const response = await tripAPI.getDriverTrips({ 
        assignedDriver: userData._id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      console.log('Trips response:', response);
      if (response.success) {
        setTrips(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: response.pagination.totalPages,
            totalItems: response.pagination.totalItems
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      handleApiError(error, 'fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage) => {
    setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  };

  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    setShowDetailModal(true);
  };

  const handleStartTrip = async (tripId) => {
    try {
      const response = await tripAPI.updateTripStatus(tripId, {
        status: 'in_progress',
        actualStartTime: new Date().toISOString()
      });
      if (response.success) {
        toast.success('Trip started successfully!');
        fetchTrips(user); // Refresh the trips list
      } else {
        toast.error(response.message || 'Failed to start trip');
      }
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error('Failed to start trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      const response = await tripAPI.updateTripStatus(tripId, {
        status: 'completed',
        actualEndTime: new Date().toISOString()
      });
      if (response.success) {
        toast.success('Trip completed successfully!');
        fetchTrips(user); // Refresh the trips list
      } else {
        toast.error(response.message || 'Failed to complete trip');
      }
    } catch (error) {
      console.error('Error completing trip:', error);
      toast.error('Failed to complete trip');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout 
      user={user}
      activePage="Trips"
      navigationItems={navigationItems}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-600 mt-2">View and manage your assigned trips</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {trips.filter(trip => trip.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {trips.filter(trip => trip.status === 'in_progress').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiTruck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-purple-600">
                  Rs. {trips.filter(trip => trip.status === 'completed').reduce((sum, trip) => {
                    const fare = trip.fare || 0;
                    const fareValue = typeof fare === 'string' ? fare.replace('Rs. ', '') : fare;
                    return sum + parseInt(fareValue) || 0;
                  }, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div> */}
        </div>

        {/* Trips List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Trips</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading trips...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8">
                <FiTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mt-2">No trips found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-theme-primary-light rounded-lg flex items-center justify-center">
                        <FiTruck className="w-6 h-6 text-theme-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          <span 
                            className="block truncate cursor-help" 
                            title={`${trip.startLocation?.address || 'Unknown Start'} → ${trip.endLocation?.address || 'Unknown End'}`}
                            style={{ 
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {(trip.startLocation?.address || 'Unknown Start').split(',')[0]} → {(trip.endLocation?.address || 'Unknown End').split(',')[0]}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(trip.scheduledStartTime || trip.startTime || trip.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Distance: {trip.distance || 'N/A'} • Fare: {trip.fare || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status.replace('-', ' ').toUpperCase()}
                      </span>
                      
                      {/* Action buttons based on trip status */}
                      {trip.status === 'scheduled' && (
                        <button 
                          onClick={() => handleStartTrip(trip._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-300 text-sm flex items-center space-x-1"
                        >
                          <FiPlay className="w-3 h-3" />
                          <span>Start Trip</span>
                        </button>
                      )}
                      
                      {trip.status === 'in_progress' && (
                        <button 
                          onClick={() => handleCompleteTrip(trip._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300 text-sm flex items-center space-x-1"
                        >
                          <FiSquare className="w-3 h-3" />
                          <span>Complete Trip</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleViewDetails(trip)}
                        className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-300 text-sm flex items-center space-x-1"
                      >
                        <FiEye className="w-3 h-3" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </motion.div>

        {/* Trip Detail Modal */}
        <TripDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          trip={selectedTrip}
        />
      </div>
    </DashboardLayout>
  );
};

export default DriverTripsPage;
