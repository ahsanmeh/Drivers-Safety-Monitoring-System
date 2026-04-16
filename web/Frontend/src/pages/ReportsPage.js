import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBarChart,
  FiDownload,
  FiUsers,
  FiTruck,
  FiAlertTriangle,
  FiClock,
  FiDollarSign,
  FiVideo,
  FiUser
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { tripAPI, vehicleAPI, incidentAPI } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);

  // Data states
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Chart data states
  const [tripStats, setTripStats] = useState({});
  const [vehicleStats, setVehicleStats] = useState({});
  const [incidentStats, setIncidentStats] = useState({});

  const navigationItems = [
    { name: 'Trips', icon: FiClock, path: '/dashboard/trips' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/dashboard/incidents' },
    { name: 'Vehicles', icon: FiTruck, path: '/dashboard/vehicles' },
    { name: 'Users', icon: FiUsers, path: '/dashboard/users' },
    { name: 'Reports', icon: FiDollarSign, path: '/dashboard/reports' },
    { name: 'Live Monitor', icon: FiVideo, path: '/dashboard/live' },
    { name: 'Profile', icon: FiUser, path: '/dashboard/profile' }
  ];

  const processChartData = useCallback((tripsData, vehiclesData, incidentsData) => {
    console.log('Processing chart data:', { tripsData, vehiclesData, incidentsData });

    // Process trips data
    const tripStatusCounts = tripsData.reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {});

    const tripTrends = getDateTrends(tripsData, 'createdAt');
    const driverTripCounts = getDriverTripCounts(tripsData);

    setTripStats({
      statusCounts: tripStatusCounts,
      trends: tripTrends,
      driverCounts: driverTripCounts
    });

    // Process vehicles data
    const vehicleStatusCounts = vehiclesData.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    }, {});

    const vehicleMakeCounts = vehiclesData.reduce((acc, vehicle) => {
      acc[vehicle.make] = (acc[vehicle.make] || 0) + 1;
      return acc;
    }, {});

    setVehicleStats({
      statusCounts: vehicleStatusCounts,
      makeCounts: vehicleMakeCounts
    });

    // Process incidents data
    console.log('Processing incidents:', incidentsData);
    const incidentTypeCounts = incidentsData.reduce((acc, incident) => {
      const type = incident.incidentType || incident.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const incidentSeverityCounts = incidentsData.reduce((acc, incident) => {
      const severity = incident.severity || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const driverIncidentCounts = getDriverIncidentCounts(incidentsData);
    const incidentTrends = getDateTrends(incidentsData, 'reportedAt');

    console.log('Incident stats:', {
      typeCounts: incidentTypeCounts,
      severityCounts: incidentSeverityCounts,
      driverCounts: driverIncidentCounts,
      trends: incidentTrends
    });

    setIncidentStats({
      typeCounts: incidentTypeCounts,
      severityCounts: incidentSeverityCounts,
      driverCounts: driverIncidentCounts,
      trends: incidentTrends
    });
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsResponse, vehiclesResponse, incidentsResponse] = await Promise.all([
        tripAPI.getAllTrips(),
        vehicleAPI.getAllVehicles(),
        incidentAPI.getAllIncidents()
      ]);

      if (tripsResponse.success) setTrips(tripsResponse.data);
      if (vehiclesResponse.success) setVehicles(vehiclesResponse.data);
      if (incidentsResponse.success) setIncidents(incidentsResponse.data);

      // Process data for charts
      processChartData(tripsResponse.data, vehiclesResponse.data, incidentsResponse.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  }, [processChartData]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);


  const getDateTrends = (data, dateField) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const count = data.filter(item => {
        // Try different possible date field names
        const dateValue = item[dateField] || item.createdAt || item.date || item.timestamp;
        if (!dateValue) return false;

        try {
          const itemDate = new Date(dateValue).toISOString().split('T')[0];
          return itemDate === date;
        } catch (error) {
          console.warn('Invalid date format:', dateValue);
          return false;
        }
      }).length;
      return { date, count };
    });
  };

  const getDriverTripCounts = (tripsData) => {
    return tripsData.reduce((acc, trip) => {
      if (trip.assignedDriver) {
        const driverName = trip.assignedDriver.name;
        acc[driverName] = (acc[driverName] || 0) + 1;
      }
      return acc;
    }, {});
  };

  const getDriverIncidentCounts = (incidentsData) => {
    return incidentsData.reduce((acc, incident) => {
      // Try different possible field names for the reporter
      const reporter = incident.reportedBy || incident.driver || incident.assignedDriver;
      if (reporter) {
        const driverName = reporter.name || reporter.firstName + ' ' + reporter.lastName || 'Unknown';
        acc[driverName] = (acc[driverName] || 0) + 1;
      } else {
        // If no reporter info, count as 'Unknown'
        acc['Unknown'] = (acc['Unknown'] || 0) + 1;
      }
      return acc;
    }, {});
  };

  // Chart configurations
  const getTripStatusChartData = () => ({
    labels: Object.keys(tripStats.statusCounts || {}),
    datasets: [{
      data: Object.values(tripStats.statusCounts || {}),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  });

  const getIncidentTypeChartData = () => {
    const typeCounts = incidentStats.typeCounts || {};
    const hasData = Object.keys(typeCounts).length > 0;

    return {
      labels: hasData ? Object.keys(typeCounts) : ['No Data'],
      datasets: [{
        data: hasData ? Object.values(typeCounts) : [1],
        backgroundColor: hasData ? [
          '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
        ] : ['#E5E7EB'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  const getTripTrendsChartData = () => ({
    labels: tripStats.trends?.map(t => new Date(t.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Trips Created',
      data: tripStats.trends?.map(t => t.count) || [],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });

  const getIncidentTrendsChartData = () => {
    const trends = incidentStats.trends || [];

    return {
      labels: trends.length > 0 ? trends.map(t => new Date(t.date).toLocaleDateString()) : ['No Data'],
      datasets: [{
        label: 'Incidents Reported',
        data: trends.length > 0 ? trends.map(t => t.count) : [0],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  };

  const getDriverIncidentChartData = () => {
    const driverCounts = incidentStats.driverCounts || {};
    const sortedDrivers = Object.entries(driverCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 drivers with most incidents

    const hasData = sortedDrivers.length > 0;

    return {
      labels: hasData ? sortedDrivers.map(([name]) => name) : ['No Data'],
      datasets: [{
        label: 'Incidents',
        data: hasData ? sortedDrivers.map(([, count]) => count) : [0],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1
      }]
    };
  };

  const getVehicleMakeChartData = () => ({
    labels: Object.keys(vehicleStats.makeCounts || {}),
    datasets: [{
      data: Object.values(vehicleStats.makeCounts || {}),
      backgroundColor: [
        '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Export functions
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Trips sheet
    const tripsSheet = XLSX.utils.json_to_sheet(trips.map(trip => ({
      'Trip Number': trip.tripNumber,
      'Driver': trip.assignedDriver?.name || 'Unassigned',
      'Vehicle': trip.assignedVehicle?.licensePlate || 'Unassigned',
      'Status': trip.status,
      'Start Location': trip.startLocation?.address || 'N/A',
      'End Location': trip.endLocation?.address || 'N/A',
      'Distance': trip.distance,
      'Duration': trip.estimatedDuration,
      'Priority': trip.priority,
      'Created At': new Date(trip.createdAt).toLocaleDateString()
    })));

    // Vehicles sheet
    const vehiclesSheet = XLSX.utils.json_to_sheet(vehicles.map(vehicle => ({
      'Make': vehicle.make,
      'Model': vehicle.model,
      'Year': vehicle.year,
      'License Plate': vehicle.licensePlate,
      'VIN': vehicle.vin,
      'Color': vehicle.color,
      'Status': vehicle.status,
      'Mileage': vehicle.mileage,
      'Assigned Driver': vehicle.assignedDriver?.name || 'Unassigned',
      'Created At': new Date(vehicle.createdAt).toLocaleDateString()
    })));

    // Incidents sheet
    const incidentsSheet = XLSX.utils.json_to_sheet(incidents.map(incident => ({
      'Type': incident.incidentType,
      'Severity': incident.severity,
      'Status': incident.status,
      'Location': incident.location?.address || 'N/A',
      'Description': incident.description,
      'Reported By': incident.reportedBy?.name || 'Unknown',
      'Vehicle': incident.vehicle?.licensePlate || 'N/A',
      'Trip': incident.trip?.tripNumber || 'N/A',
      'Reported At': new Date(incident.reportedAt).toLocaleDateString()
    })));

    XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Trips');
    XLSX.utils.book_append_sheet(workbook, vehiclesSheet, 'Vehicles');
    XLSX.utils.book_append_sheet(workbook, incidentsSheet, 'Incidents');

    XLSX.writeFile(workbook, `fleet-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout user={user} activePage="Reports" navigationItems={navigationItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} activePage="Reports" navigationItems={navigationItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive fleet management insights</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Trips"
            value={trips.length}
            icon={FiTruck}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Vehicles"
            value={vehicles.filter(v => v.status === 'active').length}
            icon={FiTruck}
            color="bg-green-500"
          />
          <StatCard
            title="Total Incidents"
            value={incidents.length}
            icon={FiAlertTriangle}
            color="bg-red-500"
          />
          <StatCard
            title="Resolved Incidents"
            value={incidents.filter(i => i.status === 'resolved').length}
            icon={FiAlertTriangle}
            color="bg-yellow-500"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FiBarChart },
              { id: 'trips', name: 'Trips', icon: FiTruck },
              { id: 'vehicles', name: 'Vehicles', icon: FiTruck },
              { id: 'incidents', name: 'Incidents', icon: FiAlertTriangle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status Distribution</h3>
                <div className="h-64">
                  <Pie data={getTripStatusChartData()} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Types</h3>
                <div className="h-64">
                  <Pie data={getIncidentTypeChartData()} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trips' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Trends (Last 30 Days)</h3>
                <div className="h-64">
                  <Line data={getTripTrendsChartData()} options={lineChartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Status Distribution</h3>
                <div className="h-64">
                  <Pie data={getTripStatusChartData()} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Make Distribution</h3>
                <div className="h-64">
                  <Pie data={getVehicleMakeChartData()} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Status</h3>
                <div className="h-64">
                  <Bar data={{
                    labels: Object.keys(vehicleStats.statusCounts || {}),
                    datasets: [{
                      label: 'Vehicles',
                      data: Object.values(vehicleStats.statusCounts || {}),
                      backgroundColor: '#3B82F6',
                      borderColor: '#2563EB',
                      borderWidth: 1
                    }]
                  }} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Trends (Last 30 Days)</h3>
                <div className="h-64">
                  <Line data={getIncidentTrendsChartData()} options={lineChartOptions} />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Types</h3>
                  <div className="h-64">
                    <Pie data={getIncidentTypeChartData()} options={chartOptions} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Drivers with Most Incidents</h3>
                  <div className="h-64">
                    <Bar data={getDriverIncidentChartData()} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
