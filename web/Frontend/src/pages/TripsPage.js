import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import CreateTripModal from '../components/CreateTripModal';
import EditTripModal from '../components/EditTripModal';
import TripDetailModal from '../components/TripDetailModal';
import {
  FiUsers,
  FiUser,
  FiClock,
  FiAlertTriangle,
  FiTruck,
  FiDollarSign,
  FiFileText,
  FiCalendar,
  FiCheckCircle,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlay,
  FiSquare,
  FiVideo
} from 'react-icons/fi';
import { tripAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const TripsPage = () => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const navigationItems = [
    { name: 'Trips', icon: FiClock, path: '/dashboard/trips' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/dashboard/incidents' },
    { name: 'Vehicles', icon: FiTruck, path: '/dashboard/vehicles' },
    { name: 'Users', icon: FiUsers, path: '/dashboard/users' },
    { name: 'Reports', icon: FiDollarSign, path: '/dashboard/reports' },
    { name: 'Live Monitor', icon: FiVideo, path: '/dashboard/live' },
    { name: 'Profile', icon: FiUser, path: '/dashboard/profile' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getAllTrips();

      if (response.success) {
        setTrips(response.data);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
      // Mock data for development
      setTrips([
        {
          _id: '1',
          tripNumber: 'TRP000001',
          assignedDriver: { name: 'John Driver', email: 'john@example.com' },
          assignedVehicle: { make: 'Toyota', model: 'Camry', licensePlate: 'ABC-123' },
          startLocation: { address: '123 Start St, Start City' },
          endLocation: { address: '456 End St, End City' },
          scheduledStartTime: '2024-02-01T08:00:00.000Z',
          scheduledEndTime: '2024-02-01T12:00:00.000Z',
          status: 'scheduled',
          distance: 25.5,
          estimatedDuration: 240
        },
        {
          _id: '2',
          tripNumber: 'TRP000002',
          assignedDriver: { name: 'Jane Driver', email: 'jane@example.com' },
          assignedVehicle: { make: 'Honda', model: 'Civic', licensePlate: 'XYZ-789' },
          startLocation: { address: '789 Origin St, Origin City' },
          endLocation: { address: '321 Destination St, Destination City' },
          scheduledStartTime: '2024-02-01T14:00:00.000Z',
          scheduledEndTime: '2024-02-01T18:00:00.000Z',
          status: 'in_progress',
          distance: 45.2,
          estimatedDuration: 180
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTripCreated = (newTrip) => {
    setTrips(prev => [newTrip, ...prev]);
    toast.success('Trip created successfully!');
  };

  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    setShowDetailModal(true);
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setShowEditModal(true);
  };

  const handleTripUpdated = (updatedTrip) => {
    setTrips(prev => prev.map(trip =>
      trip._id === updatedTrip._id ? updatedTrip : trip
    ));
    toast.success('Trip updated successfully!');
  };

  const handleStartTrip = async (tripId) => {
    try {
      const response = await tripAPI.updateTripStatus(tripId, {
        status: 'in_progress',
        actualStartTime: new Date().toISOString()
      });
      if (response.success) {
        toast.success('Trip started successfully!');
        fetchTrips(); // Refresh the trips list
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
        fetchTrips(); // Refresh the trips list
      } else {
        toast.error(response.message || 'Failed to complete trip');
      }
    } catch (error) {
      console.error('Error completing trip:', error);
      toast.error('Failed to complete trip');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const response = await tripAPI.deleteTrip(tripId);
        if (response.success) {
          toast.success('Trip deleted successfully!');
          setTrips(prev => prev.filter(trip => trip._id !== tripId));
        } else {
          toast.error(response.message || 'Failed to delete trip');
        }
      } catch (error) {
        console.error('Error deleting trip:', error);
        toast.error('Failed to delete trip');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Trip Management</h1>
              <p className="text-gray-600">Monitor and manage all trip assignments</p>
            </div>
            {user?.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg flex items-center space-x-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>Create Trip</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Trips', value: trips.length, icon: FiClock, color: 'bg-blue-500' },
            { title: 'Scheduled', value: trips.filter(t => t.status === 'scheduled').length, icon: FiCalendar, color: 'bg-yellow-500' },
            { title: 'In Progress', value: trips.filter(t => t.status === 'in_progress').length, icon: FiTruck, color: 'bg-blue-500' },
            { title: 'Completed', value: trips.filter(t => t.status === 'completed').length, icon: FiCheckCircle, color: 'bg-green-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`w-16 h-16 ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trips List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Recent Trips</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search trips..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300">
                  Filter
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {trip.tripNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                            {trip.status}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Driver</p>
                            <p className="font-medium text-gray-800">{trip.assignedDriver?.name}</p>
                            <p className="text-sm text-gray-500">{trip.assignedDriver?.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Vehicle</p>
                            <p className="font-medium text-gray-800">
                              {trip.assignedVehicle?.make} {trip.assignedVehicle?.model}
                            </p>
                            <p className="text-sm text-gray-500">{trip.assignedVehicle?.licensePlate}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-600 text-sm mb-2">From</p>
                            <p
                              className="font-medium text-gray-800 truncate cursor-help"
                              title={trip.startLocation?.address || 'Unknown Start'}
                              style={{
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {(trip.startLocation?.address || 'Unknown Start').split(',')[0]}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-600 text-sm mb-2">To</p>
                            <p
                              className="font-medium text-gray-800 truncate cursor-help"
                              title={trip.endLocation?.address || 'Unknown End'}
                              style={{
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {(trip.endLocation?.address || 'Unknown End').split(',')[0]}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-6">
                        <p className="text-sm text-gray-600 mb-1">Distance</p>
                        <p className="text-lg font-semibold text-gray-800">{trip.distance} km</p>
                        <p className="text-sm text-gray-600 mt-2">Duration</p>
                        <p className="text-sm font-medium text-gray-800">{Math.floor(trip.estimatedDuration / 60)}h {trip.estimatedDuration % 60}m</p>

                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleViewDetails(trip)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300 flex items-center space-x-1"
                          >
                            <FiEye className="w-3 h-3" />
                            <span>View</span>
                          </button>

                          {trip.status === 'scheduled' && (
                            <button
                              onClick={() => handleStartTrip(trip._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-300 flex items-center space-x-1"
                            >
                              <FiPlay className="w-3 h-3" />
                              <span>Start</span>
                            </button>
                          )}

                          {trip.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteTrip(trip._id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300 flex items-center space-x-1"
                            >
                              <FiSquare className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleEditTrip(trip)}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-300 flex items-center space-x-1"
                          >
                            <FiEdit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteTrip(trip._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300 flex items-center space-x-1"
                          >
                            <FiTrash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Create Trip Modal */}
        <CreateTripModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTripCreated={handleTripCreated}
        />

        {/* Edit Trip Modal */}
        <EditTripModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          trip={selectedTrip}
          onTripUpdated={handleTripUpdated}
        />

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

export default TripsPage;
