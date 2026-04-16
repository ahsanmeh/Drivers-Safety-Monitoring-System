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
  FiDownload,
  FiEye,
  FiSettings,
  FiMapPin,
  FiActivity
} from 'react-icons/fi';
import { logAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const DriverLogsPage = () => {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const navigationItems = [
    { name: 'Trips', icon: FiClock, path: '/driver-dashboard/trips' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/driver-dashboard/incidents' },
    { name: 'Vehicles', icon: FiTruck, path: '/driver-dashboard/vehicles' },
    { name: 'Reports', icon: FiDollarSign, path: '/driver-dashboard/reports' },
    { name: 'Data Logs', icon: FiFileText, path: '/driver-dashboard/logs' },
    { name: 'Profile', icon: FiUser, path: '/driver-dashboard/profile' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Call fetchLogs after user is set
      fetchLogs(parsedUser);
    }
  }, [filterType]);

  const fetchLogs = async (userData = user) => {
    if (!userData) return;

    try {
      setLoading(true);
      console.log('Fetching logs for user:', userData._id);

      // Fetch activity logs for current driver
      const response = await logAPI.getActivityLogs({ userId: userData._id });
      console.log('Logs response:', response);

      if (response.success) {
        let filteredLogs = response.data;

        // Filter logs based on selected type
        if (filterType !== 'all') {
          filteredLogs = response.data.filter(log => log.type === filterType);
        }

        setLogs(filteredLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'trip':
        return 'bg-blue-100 text-blue-800';
      case 'vehicle':
        return 'bg-green-100 text-green-800';
      case 'incident':
        return 'bg-red-100 text-red-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'trip':
        return FiClock;
      case 'vehicle':
        return FiTruck;
      case 'incident':
        return FiAlertTriangle;
      case 'system':
        return FiSettings;
      case 'maintenance':
        return FiSettings;
      default:
        return FiFileText;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout
      user={user}
      activePage="Data Logs"
      navigationItems={navigationItems}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Logs</h1>
            <p className="text-gray-600 mt-2">Track all your activities and system events</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent"
            >
              <option value="all">All Logs</option>
              <option value="trip">Trips</option>
              <option value="vehicle">Vehicle</option>
              <option value="incident">Incidents</option>
              <option value="system">System</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-theme-primary text-white px-6 py-3 rounded-lg hover:bg-theme-primary-hover transition-colors duration-300 shadow-lg flex items-center space-x-2"
            >
              <FiDownload className="w-5 h-5" />
              <span>Export Logs</span>
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-gray-600" />
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
                <p className="text-sm font-medium text-gray-600">Trip Logs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {logs.filter(log => log.type === 'trip').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Vehicle Logs</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(log => log.type === 'vehicle').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiTruck className="w-6 h-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Incident Logs</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter(log => log.type === 'incident').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Logs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {logs.filter(log => log.type === 'system').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiSettings className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mt-2">No logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {React.createElement(getTypeIcon(log.type), { className: "w-6 h-6 text-gray-600" })}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{log.action}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                          {log.type.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </span>
                        {log.location && (
                          <span className="flex items-center space-x-1">
                            <FiMapPin className="w-4 h-4" />
                            <span>{log.location}</span>
                          </span>
                        )}
                        {log.vehicleId && (
                          <span className="flex items-center space-x-1">
                            <FiTruck className="w-4 h-4" />
                            <span>{log.vehicleId}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-300 text-sm flex items-center space-x-1">
                        <FiEye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      {log.tripId && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {log.tripId}
                        </span>
                      )}
                      {log.incidentId && (
                        <span className="text-xs text-gray-500 bg-red-100 px-2 py-1 rounded">
                          {log.incidentId}
                        </span>
                      )}
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

export default DriverLogsPage;
