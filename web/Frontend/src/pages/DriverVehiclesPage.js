import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { 
  FiHome, 
  FiUser, 
  FiClock, 
  FiAlertTriangle, 
  FiTruck, 
  FiDollarSign, 
  FiFileText,
  FiCheckCircle,
  FiSettings,
  FiAlertCircle,
  FiXCircle
} from 'react-icons/fi';
import { vehicleAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const DriverVehiclesPage = () => {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // Call fetchVehicles after user is set
      fetchVehicles(parsedUser);
    }
  }, []);

  const fetchVehicles = async (userData = user) => {
    if (!userData) return;
    
    try {
      setLoading(true);
      console.log('Fetching vehicles for user:', userData._id);
      // Get vehicles assigned to current driver
      const response = await vehicleAPI.getAllVehicles({ assignedDriver: userData._id });
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
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'maintenance':
        return <FiSettings className="w-5 h-5 text-yellow-600" />;
      case 'inactive':
        return <FiXCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FiTruck className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout 
      user={user}
      activePage="Vehicles"
      navigationItems={navigationItems}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Vehicles</h1>
            <p className="text-gray-600 mt-2">View your assigned vehicles</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiTruck className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {vehicles.filter(vehicle => vehicle.status === 'active').length}
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
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {vehicles.filter(vehicle => vehicle.status === 'maintenance').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiSettings className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Service Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  {vehicles.filter(vehicle => {
                    if (!vehicle.nextServiceDate) return false;
                    const nextService = new Date(vehicle.nextServiceDate);
                    const today = new Date();
                    const daysUntilService = Math.ceil((nextService - today) / (1000 * 60 * 60 * 24));
                    return daysUntilService <= 30;
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vehicles List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Vehicle Details</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading vehicles...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8">
                <FiTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mt-2">No vehicles assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {vehicles.map((vehicle, index) => (
                  <motion.div
                    key={vehicle._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-theme-primary-light rounded-lg flex items-center justify-center">
                          <FiTruck className="w-6 h-6 text-theme-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{vehicle.licensePlate}</h3>
                          <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(vehicle.status)}`}>
                        <span>{getStatusIcon(vehicle.status)}</span>
                        <span>{vehicle.status.toUpperCase()}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">VIN</p>
                        <p className="font-medium text-gray-900">{vehicle.vin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Mileage</p>
                        <p className="font-medium text-gray-900">{vehicle.mileage?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Color</p>
                        <p className="font-medium text-gray-900">{vehicle.color || 'N/A'}</p>
                      </div>
                      {vehicle.lastServiceDate && (
                        <div>
                          <p className="text-gray-600">Last Service</p>
                          <p className="font-medium text-gray-900">{new Date(vehicle.lastServiceDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {vehicle.nextServiceDate && (
                        <div>
                          <p className="text-gray-600">Next Service</p>
                          <p className="font-medium text-gray-900">{new Date(vehicle.nextServiceDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm space-y-1">
                        {vehicle.registrationExpiry && (
                          <div>
                            <p className="text-gray-600">Registration Expiry</p>
                            <p className="font-medium text-gray-900">{new Date(vehicle.registrationExpiry).toLocaleDateString()}</p>
                          </div>
                        )}
                        {vehicle.insuranceExpiry && (
                          <div>
                            <p className="text-gray-600">Insurance Expiry</p>
                            <p className="font-medium text-gray-900">{new Date(vehicle.insuranceExpiry).toLocaleDateString()}</p>
                          </div>
                        )}
                        {!vehicle.registrationExpiry && !vehicle.insuranceExpiry && (
                          <div>
                            <p className="text-gray-600">Expiry Information</p>
                            <p className="font-medium text-gray-900">Not Available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DriverVehiclesPage;
