import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import CreateVehicleModal from '../components/CreateVehicleModal';
import EditVehicleModal from '../components/EditVehicleModal';
import {
  FiUsers,
  FiClock,
  FiAlertTriangle,
  FiTruck,
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiVideo,
  FiUser
} from 'react-icons/fi';
import { vehicleAPI } from '../services/api';

const VehicleManagement = () => {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { name: 'Trips', icon: FiClock, path: '/dashboard/trips' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/dashboard/incidents' },
    { name: 'Vehicles', icon: FiTruck, path: '/dashboard/vehicles' },
    { name: 'Users', icon: FiUsers, path: '/dashboard/users' },
    { name: 'Reports', icon: FiDollarSign, path: '/dashboard/reports' },
    { name: 'Live Monitor', icon: FiVideo, path: '/dashboard/live' },
    { name: 'Profile', icon: FiUser, path: '/dashboard/profile' }
  ];


  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching vehicles for admin');
      const response = await vehicleAPI.getAllVehicles();
      console.log('Vehicles response:', response);

      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, []); // Remove user dependency to prevent circular dependency

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
    // Fetch vehicles after user is set
    fetchVehicles();
  }, [fetchVehicles]);



  const handleVehicleCreated = (newVehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
    toast.success('Vehicle created successfully!');
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleVehicleUpdated = (updatedVehicle) => {
    setVehicles(prev => prev.map(vehicle =>
      vehicle._id === updatedVehicle._id ? updatedVehicle : vehicle
    ));
    toast.success('Vehicle updated successfully!');
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        const response = await vehicleAPI.deleteVehicle(vehicleId);
        if (response.success) {
          toast.success('Vehicle deleted successfully!');
          setVehicles(prev => prev.filter(vehicle => vehicle._id !== vehicleId));
        } else {
          toast.error(response.message || 'Failed to delete vehicle');
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        toast.error('Failed to delete vehicle');
      }
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = searchQuery.toLowerCase();
    return (
      vehicle.make?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.year?.toString().includes(searchLower) ||
      vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
      vehicle.vin?.toLowerCase().includes(searchLower)
    );
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout
      user={user}
      activePage="Vehicles"
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Vehicle Management</h1>
              <p className="text-gray-600">Manage your fleet of vehicles efficiently</p>
            </div>
            {user?.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg flex items-center space-x-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>Create Vehicle</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Vehicles List</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12">
                <FiTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No vehicles found</p>
                {user?.role === 'admin' && (
                  <p className="text-gray-500 mt-2">Click "Create Vehicle" to add your first vehicle</p>
                )}
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FiTruck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">No results matching "{searchQuery}"</h3>
                <p className="text-gray-600">Try adjusting your search terms or filters to find what you're looking for.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-blue-600 font-medium hover:text-blue-700 underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVehicles.map((vehicle, index) => (
                  <motion.div
                    key={vehicle._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <FiTruck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-gray-600">License: {vehicle.licensePlate}</p>
                          <p className="text-gray-600">VIN: {vehicle.vin}</p>
                          <p className="text-gray-600">Color: {vehicle.color}</p>
                          <p className="text-gray-600">Mileage: {vehicle.mileage?.toLocaleString() || 'N/A'} miles</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${vehicle.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : vehicle.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : vehicle.status === 'under_maintenance'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {vehicle.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                        </span>
                        {vehicle.assignedDriver && (
                          <p className="text-sm text-gray-600 mt-2">
                            Driver: {vehicle.assignedDriver.name}
                          </p>
                        )}
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(vehicle._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300"
                          >
                            Delete
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

        {/* Create Vehicle Modal */}
        <CreateVehicleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onVehicleCreated={handleVehicleCreated}
        />

        {/* Edit Vehicle Modal */}
        <EditVehicleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          vehicle={selectedVehicle}
          onVehicleUpdated={handleVehicleUpdated}
        />
      </div>
    </DashboardLayout>
  );
};

export default VehicleManagement;
