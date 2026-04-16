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
  FiBarChart,
  FiDownload,
  FiEye,
  FiTrendingUp,
  FiMapPin,
  FiStar
} from 'react-icons/fi';
import { reportAPI, tripAPI, incidentAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const DriverReportsPage = () => {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const navigationItems = [
    { name: 'Trips', icon: FiClock, path: '/driver-dashboard/trips' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/driver-dashboard/incidents' },
    { name: 'Vehicles', icon: FiTruck, path: '/driver-dashboard/vehicles' },
    { name: 'Reports', icon: FiDollarSign, path: '/driver-dashboard/reports' },
    { name: 'Data Logs', icon: FiFileText, path: '/driver-dashboard/logs' },
    { name: 'Profile', icon: FiUser, path: '/driver-dashboard/profile' }
  ];

  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalTrips: 0,
    totalDistance: 0,
    averageRating: 0,
    weeklyEarnings: [],
    tripTrends: []
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Call fetchReports after user is set
      fetchReports(parsedUser);
    }
  }, [selectedPeriod]);

  const fetchReports = async (userData = user) => {
    if (!userData) return;

    try {
      setLoading(true);
      console.log('Fetching reports for user:', userData._id);

      // Fetch driver performance report
      const performanceResponse = await reportAPI.getDriverPerformance();
      if (performanceResponse.success) {
        // Find current driver's performance data
        const driverPerformance = performanceResponse.data.driverPerformance.find(
          driver => driver._id === userData._id
        );

        if (driverPerformance) {
          setStats({
            totalEarnings: driverPerformance.totalEarnings || 0,
            totalTrips: driverPerformance.totalTrips,
            totalDistance: driverPerformance.totalDistance,
            averageRating: driverPerformance.averageRating || 4.5,
            weeklyEarnings: [], // You might need a separate API for this
            tripTrends: [] // You might need a separate API for this
          });
        }
      }

      // Fetch recent trips for reports
      const tripsResponse = await tripAPI.getDriverTrips({ assignedDriver: userData._id });
      if (tripsResponse.success) {
        const trips = tripsResponse.data;
        const reports = trips.map(trip => ({
          id: trip._id,
          type: 'Trip Report',
          period: new Date(trip.scheduledStartTime).toLocaleDateString(),
          earnings: trip.estimatedFare || 0,
          trips: 1,
          distance: `${trip.distance} km`,
          rating: 4.5,
          generatedAt: trip.createdAt
        }));
        setReports(reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout
      user={user}
      activePage="Reports"
      navigationItems={navigationItems}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Track your performance and earnings</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-theme-primary text-white px-6 py-3 rounded-lg hover:bg-theme-primary-hover transition-colors duration-300 shadow-lg flex items-center space-x-2"
            >
              <FiBarChart className="w-5 h-5" />
              <span>Generate Report</span>
            </motion.button>
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
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">Rs. {stats.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTrips}</p>
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
                <p className="text-sm font-medium text-gray-600">Distance Covered</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalDistance} km</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiMapPin className="w-6 h-6 text-purple-600" />
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
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600 flex items-center">{stats.averageRating} <FiStar className="w-6 h-6 ml-1" /></p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiStar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Earnings</h3>
            <div className="space-y-4">
              {stats.weeklyEarnings.map((day, index) => (
                <div key={day.day} className="flex items-center space-x-3">
                  <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(day.amount / Math.max(...stats.weeklyEarnings.map(d => d.amount))) * 100}%`,
                        transitionDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                  <div className="w-16 text-sm font-medium text-gray-900 text-right">
                    Rs. {day.amount}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trip Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Trends</h3>
            <div className="space-y-4">
              {stats.tripTrends.map((trend, index) => (
                <div key={trend.date} className="flex items-center space-x-3">
                  <div className="w-20 text-sm font-medium text-gray-600">
                    {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(trend.trips / Math.max(...stats.tripTrends.map(t => t.trips))) * 100}%`,
                        transitionDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                  <div className="w-8 text-sm font-medium text-gray-900 text-right">
                    {trend.trips}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Generated Reports</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <FiBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mt-2">No reports generated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiBarChart className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.type}</h3>
                        <p className="text-sm text-gray-600">Period: {report.period}</p>
                        <p className="text-sm text-gray-500">
                          Generated: {new Date(report.generatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Earnings</p>
                        <p className="font-semibold text-green-600">Rs. {report.earnings.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Trips</p>
                        <p className="font-semibold text-blue-600">{report.trips}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="font-semibold text-yellow-600 flex items-center">{report.rating} <FiStar className="w-4 h-4 ml-1" /></p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-300 text-sm flex items-center space-x-1">
                          <FiEye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button className="text-green-600 hover:text-green-700 transition-colors duration-300 text-sm flex items-center space-x-1">
                          <FiDownload className="w-4 h-4" />
                          <span>Download</span>
                        </button>
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

export default DriverReportsPage;
