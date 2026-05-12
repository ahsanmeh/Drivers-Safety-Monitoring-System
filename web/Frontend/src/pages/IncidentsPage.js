import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import CreateIncidentModal from '../components/CreateIncidentModal';
import EditIncidentModal from '../components/EditIncidentModal';
import IncidentDetailModal from '../components/IncidentDetailModal';
import {
  FiUsers,
  FiUser,
  FiClock,
  FiAlertTriangle,
  FiTruck,
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiFileText as FiReport,
  FiSearch,
  FiVideo
} from 'react-icons/fi';
import { incidentAPI } from '../services/api';

const IncidentsPage = () => {
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
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


  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentAPI.getAllIncidents();

      if (response.success) {
        setIncidents(response.data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to load incidents');
      // Mock data for development
      setIncidents([
        {
          _id: '1',
          incidentNumber: 'INC000001',
          reportedBy: { name: 'John Driver', email: 'john@example.com' },
          driver: { name: 'John Driver', email: 'john@example.com' },
          vehicle: { make: 'Toyota', model: 'Camry', licensePlate: 'ABC-123' },
          incidentType: 'accident',
          severity: 'medium',
          status: 'reported',
          location: { address: '789 Incident St, Incident City' },
          description: 'Minor collision with another vehicle at intersection. No injuries reported.',
          dateTime: '2024-01-15T10:30:00.000Z'
        },
        {
          _id: '2',
          incidentNumber: 'INC000002',
          reportedBy: { name: 'Jane Driver', email: 'jane@example.com' },
          driver: { name: 'Jane Driver', email: 'jane@example.com' },
          vehicle: { make: 'Honda', model: 'Civic', licensePlate: 'XYZ-789' },
          incidentType: 'breakdown',
          severity: 'low',
          status: 'resolved',
          location: { address: '456 Highway St, Highway City' },
          description: 'Engine overheating issue. Vehicle towed to nearest service center.',
          dateTime: '2024-01-14T15:45:00.000Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800';
      case 'underInvestigation': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  };

  const handleIncidentCreated = (newIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
    toast.success('Incident reported successfully!');
  };

  const handleViewDetails = (incident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
  };

  const handleEditIncident = (incident) => {
    setSelectedIncident(incident);
    setShowEditModal(true);
  };

  const handleIncidentUpdated = (updatedIncident) => {
    setIncidents(prev => prev.map(incident =>
      incident._id === updatedIncident._id ? updatedIncident : incident
    ));
    toast.success('Incident updated successfully!');
  };

  const handleDeleteIncident = async (incidentId) => {
    if (window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      try {
        const response = await incidentAPI.deleteIncident(incidentId);
        if (response.success) {
          toast.success('Incident deleted successfully!');
          setIncidents(prev => prev.filter(incident => incident._id !== incidentId));
        } else {
          toast.error(response.message || 'Failed to delete incident');
        }
      } catch (error) {
        console.error('Error deleting incident:', error);
        toast.error('Failed to delete incident');
      }
    }
  };

  const getQAStatus = (incident) => {
    if (!incident.questions || incident.questions.length === 0) {
      return { text: '', color: '' };
    }

    const answeredCount = incident.questions.filter(q => q.answer).length;
    const totalCount = incident.questions.length;

    if (answeredCount === totalCount) {
      return { text: 'Answered', color: 'text-green-600' };
    } else if (answeredCount > 0) {
      return { text: `${answeredCount}/${totalCount}`, color: 'text-blue-600' };
    } else {
      return { text: 'Pending', color: 'text-orange-600' };
    }
  };

  const handleResolveIncident = async (incidentId) => {
    if (window.confirm('Are you sure you want to resolve this incident?')) {
      try {
        const resolutionData = {
          status: 'resolved',
          resolution: 'Incident has been resolved and closed.',
          resolvedAt: new Date().toISOString()
        };
        const response = await incidentAPI.resolveIncident(incidentId, resolutionData);
        if (response.success) {
          toast.success('Incident resolved successfully!');
          fetchIncidents(); // Refresh the incidents list
        } else {
          toast.error(response.message || 'Failed to resolve incident');
        }
      } catch (error) {
        console.error('Error resolving incident:', error);
        toast.error('Failed to resolve incident');
      }
    }
  };

  // Filter incidents based on search query
  const filteredIncidents = incidents.filter(incident => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (incident.incidentNumber || '').toLowerCase().includes(q) ||
      (incident.driver?.name || '').toLowerCase().includes(q) ||
      (incident.incidentType || '').toLowerCase().includes(q) ||
      (incident.severity || '').toLowerCase().includes(q) ||
      (incident.status || '').toLowerCase().includes(q) ||
      (incident.vehicle?.make || '').toLowerCase().includes(q) ||
      (incident.vehicle?.model || '').toLowerCase().includes(q) ||
      (incident.vehicle?.licensePlate || '').toLowerCase().includes(q) ||
      (incident.location?.address || '').toLowerCase().includes(q) ||
      (incident.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout
      user={user}
      activePage="Incidents"
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Incident Management</h1>
              <p className="text-gray-600">Monitor and manage incident reports</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Total Incidents', value: incidents.length, icon: FiAlertTriangle, color: 'bg-red-500' },
            { title: 'Reported', value: incidents.filter(i => i.status === 'reported').length, icon: FiReport, color: 'bg-yellow-500' },
            { title: 'Resolved', value: incidents.filter(i => i.status === 'resolved').length, icon: FiCheckCircle, color: 'bg-green-500' }
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

        {/* Incidents List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Recent Incidents</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                {filteredIncidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FiSearch className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-lg font-medium">No incidents found</p>
                    <p className="text-sm">Try searching by driver name, type, severity, or incident number</p>
                  </div>
                ) : (
                  filteredIncidents.map((incident, index) => (
                  <motion.div
                    key={incident._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {incident.incidentNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(incident.status)}`}>
                            {incident.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Type</p>
                            <p className="font-medium text-gray-800 capitalize">{incident.incidentType}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Driver</p>
                            <p className="font-medium text-gray-800">{incident.driver?.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Vehicle</p>
                            <p className="font-medium text-gray-800">
                              {incident.vehicle?.make} {incident.vehicle?.model}
                            </p>
                            <p className="text-sm text-gray-500">{incident.vehicle?.licensePlate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm mb-2">Location</p>
                            <p className="font-medium text-gray-800">{incident.location?.address}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-gray-600 text-sm mb-2">Description</p>
                          <p className="text-gray-800">{incident.description}</p>
                        </div>

                        {/* Q&A Status */}
                        {getQAStatus(incident).text && (
                          <div className="mt-4">
                            <p className="text-gray-600 text-sm mb-1">Q&A Status</p>
                            <span className={`text-sm font-medium ${getQAStatus(incident).color}`}>
                              {getQAStatus(incident).text}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-6">
                        <p className="text-sm text-gray-600 mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(incident.dateTime).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(incident.dateTime).toLocaleTimeString()}
                        </p>

                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleViewDetails(incident)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300"
                          >
                            View
                          </button>
                          {incident.status !== 'resolved' && incident.status !== 'closed' && (
                            <button
                              onClick={() => handleResolveIncident(incident._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-300"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteIncident(incident._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>


        {/* Create Incident Modal */}
        <CreateIncidentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onIncidentCreated={handleIncidentCreated}
        />

        {/* Edit Incident Modal */}
        <EditIncidentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          incident={selectedIncident}
          onIncidentUpdated={handleIncidentUpdated}
        />

        {/* Incident Detail Modal */}
        <IncidentDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          incident={selectedIncident}
        />
      </div>
    </DashboardLayout>
  );
};

export default IncidentsPage;
