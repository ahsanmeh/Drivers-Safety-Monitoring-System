import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { FiUsers, FiClock, FiAlertTriangle, FiTruck, FiDollarSign, FiFileText, FiUserCheck, FiBarChart, FiVideo, FiUser } from 'react-icons/fi';
import { reportAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

const BACKEND_URL = `http://${window.location.hostname}:5000`;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    users: { total: 0, drivers: 0, admins: 0, activeDrivers: 0 },
    vehicles: { total: 0, active: 0, inactive: 0 },
    trips: { total: 0, completed: 0, pending: 0, in_progress: 0, completionRate: 0 },
    incidents: { total: 0, reported: 0, resolved: 0, incidentRate: 0 }
  });

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

    // Fetch dashboard statistics
    fetchDashboardStats();

    // Initialize Socket.io for real-time alerts
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('✅ Admin Dashboard connected to Socket.io');
      const userData = localStorage.getItem('user');
      if (userData) {
        const u = JSON.parse(userData);
        if (u._id) {
          socket.emit('register_admin', u._id);
        }
      }
    });

    socket.on('smoke_alert', (data) => {
      console.log('🔥 SMOKE ALERT RECEIVED:', data);

      // Show critical toast notification
      toast.error(
        <div>
          <strong>🔥 CRITICAL: SMOKE DETECTED!</strong>
          <p>Vehicle: {data.vehicle?.licensePlate || 'Unknown'}</p>
          <p>Driver: {data.driver?.name || 'Unknown'}</p>
          <p>Sensor Value: {data.value}</p>
        </div>,
        {
          duration: 15000, // Stay for 15 seconds
          style: {
            background: '#DC2626',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            border: '3px solid #FEE2E2',
          },
          icon: '🚨',
        }
      );

      // Refresh stats to show new incident
      fetchDashboardStats();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await reportAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
      setStats({
        users: { total: 25, drivers: 20, admins: 5, activeDrivers: 18 },
        vehicles: { total: 45, active: 40, inactive: 5 },
        trips: { total: 156, completed: 142, pending: 8, in_progress: 6, completionRate: 91.03 },
        incidents: { total: 12, reported: 3, resolved: 9, incidentRate: 7.69 }
      });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      subtitle: `${stats.users.drivers} drivers, ${stats.users.admins} admins`,
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Drivers',
      value: stats.users.activeDrivers,
      subtitle: 'Currently active',
      icon: FiUserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Vehicles',
      value: stats.vehicles.total,
      subtitle: `${stats.vehicles.active} active, ${stats.vehicles.inactive} inactive`,
      icon: FiTruck,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Trips',
      value: stats.trips.total,
      subtitle: `${stats.trips.completionRate.toFixed(1)}% completion rate`,
      icon: FiClock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Incidents',
      value: stats.incidents.total,
      subtitle: `${stats.incidents.resolved} resolved, ${stats.incidents.reported} reported`,
      icon: FiAlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Completion Rate',
      value: `${stats.trips.completionRate.toFixed(1)}%`,
      subtitle: 'Trip success rate',
      icon: FiBarChart,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <DashboardLayout
      user={user}
      activePage="Dashboard"
      navigationItems={navigationItems}
    >
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your fleet management system today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`${card.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{card.subtitle}</p>
                </div>
                <div className={`w-16 h-16 bg-gradient-to-r ${card.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trip Status Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Trip Status Overview</h3>

            <div className="space-y-4">
              {[
                { label: 'Completed', value: stats.trips.completed, color: 'bg-green-500', percentage: (stats.trips.completed / stats.trips.total * 100).toFixed(1) },
                { label: 'In Progress', value: stats.trips.in_progress, color: 'bg-blue-500', percentage: (stats.trips.in_progress / stats.trips.total * 100).toFixed(1) },
                { label: 'Pending', value: stats.trips.pending, color: 'bg-yellow-500', percentage: (stats.trips.pending / stats.trips.total * 100).toFixed(1) }
              ].map((item, index) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${item.color} rounded-full`}></div>
                    <span className="text-gray-700 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 font-semibold w-12 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Vehicle Status Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Vehicle Status</h3>

            <div className="space-y-4">
              {[
                { label: 'Active', value: stats.vehicles.active, color: 'bg-green-500', percentage: (stats.vehicles.active / stats.vehicles.total * 100).toFixed(1) },
                { label: 'Inactive', value: stats.vehicles.inactive, color: 'bg-red-500', percentage: (stats.vehicles.inactive / stats.vehicles.total * 100).toFixed(1) }
              ].map((item, index) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${item.color} rounded-full`}></div>
                    <span className="text-gray-700 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 font-semibold w-12 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Add Vehicle', icon: FiTruck, path: '/dashboard/vehicles', color: 'bg-blue-500 hover:bg-blue-600' },
              { title: 'Assign Trip', icon: FiClock, path: '/dashboard/trips', color: 'bg-green-500 hover:bg-green-600' },
              { title: 'View Reports', icon: FiBarChart, path: '/dashboard/reports', color: 'bg-purple-500 hover:bg-purple-600' },
              { title: 'Manage Drivers', icon: FiUsers, path: '/dashboard/drivers', color: 'bg-orange-500 hover:bg-orange-600' }
            ].map((action, index) => (
              <motion.button
                key={action.title}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${action.color} text-white p-4 rounded-xl shadow-lg transition-all duration-300`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <action.icon className="w-8 h-8" />
                  </div>
                  <p className="font-semibold">{action.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
