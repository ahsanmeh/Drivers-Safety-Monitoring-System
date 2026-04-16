import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import CreateDriverIncidentModal from '../components/CreateDriverIncidentModal';
import IncidentDetailModal from '../components/IncidentDetailModal';
import AnswerQuestionsModal from '../components/AnswerQuestionsModal';
import { 
  FiHome, 
  FiUser, 
  FiClock, 
  FiAlertTriangle, 
  FiTruck, 
  FiDollarSign, 
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiClock as FiClockIcon,
  FiX,
  FiPlus
} from 'react-icons/fi';
import { incidentAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { testAPIConnection, testAuthAPI } from '../utils/testAPI';

const DriverIncidentsPage = () => {
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleTestAPI = async () => {
    console.log('Testing API connection...');
    const healthTest = await testAPIConnection();
    const authTest = await testAuthAPI();
    console.log('Health Test:', healthTest);
    console.log('Auth Test:', authTest);
    toast.info('Check console for API test results');
  };

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
      // Call fetchIncidents after user is set
      fetchIncidents(parsedUser);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const fetchIncidents = async (userData = user) => {
    if (!userData) return;
    
    try {
      setLoading(true);
      console.log('Fetching incidents for user:', userData._id);
      // Get incidents reported by current driver with pagination
      const response = await incidentAPI.getAllIncidents({ 
        driver: userData._id,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      console.log('Incidents response:', response);
      if (response.success) {
        setIncidents(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: response.pagination.totalPages,
            totalItems: response.pagination.totalItems
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to fetch incidents');
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


  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported':
        return 'bg-blue-100 text-blue-800';
      case 'under-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const handleIncidentCreated = (newIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
    toast.success('Incident reported successfully!');
  };

  const handleViewDetails = (incident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
  };

  const handleAnswerQuestions = (incident) => {
    setSelectedIncident(incident);
    setShowAnswerModal(true);
  };

  const handleAnswersUpdated = () => {
    fetchIncidents(); // Refresh incidents list
    setShowAnswerModal(false);
  };

  const getQAStatus = (incident) => {
    if (!incident.questions || incident.questions.length === 0) {
      return { showButton: false, text: '', color: '' };
    }
    
    const answeredCount = incident.questions.filter(q => q.answer).length;
    const totalCount = incident.questions.length;
    
    if (answeredCount === totalCount) {
      return { showButton: false, text: 'Answered', color: 'text-green-600' };
    } else if (answeredCount > 0) {
      return { showButton: true, text: `${answeredCount}/${totalCount}`, color: 'text-blue-600' };
    } else {
      return { showButton: true, text: '', color: '' };
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout 
      user={user}
      activePage="Incidents"
      navigationItems={navigationItems}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incident Reports</h1>
            <p className="text-gray-600 mt-2">Report and track incidents</p>
          </div>
            {/* Create Incident Button - Hidden for drivers */}
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-lg flex items-center space-x-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Report Incident</span>
            </motion.button> */}
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
                <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
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
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {incidents.filter(incident => incident.status === 'resolved').length}
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
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {incidents.filter(incident => incident.status === 'under-review').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiClockIcon className="w-6 h-6 text-yellow-600" />
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
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {incidents.filter(incident => incident.severity === 'high').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Incidents List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Incidents</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading incidents...</p>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8">
                <FiAlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mt-2">No incidents reported</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident, index) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FiAlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                      {/*capitalize the first letter of the incident type*/}
                        <h3 className="font-semibold text-gray-900">{incident.incidentType.slice(0, 1).toUpperCase() + incident.incidentType.slice(1) || incident.type.slice(0, 1).toUpperCase() + incident.type.slice(1) || 'Unknown Type'}</h3>
                        <p className="text-sm text-gray-600">{incident.description}</p>
                        <p className="text-sm text-gray-500">
                          Location: {incident.location?.address || incident.location || 'Unknown Location'} • Reported: {new Date(incident.reportedAt || incident.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {getQAStatus(incident).text && (
                          <span className={`text-xs font-medium whitespace-nowrap ${getQAStatus(incident).color}`}>
                            {getQAStatus(incident).text}
                          </span>
                        )}
                        {getQAStatus(incident).showButton && (
                          <button 
                            onClick={() => handleAnswerQuestions(incident)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-300 whitespace-nowrap"
                          >
                            Answer Questions
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewDetails(incident)}
                          className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-300 text-xs whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </div>
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


        {/* Create Incident Modal */}
        <CreateDriverIncidentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onIncidentCreated={handleIncidentCreated}
        />

        {/* Incident Detail Modal */}
        <IncidentDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          incident={selectedIncident}
        />

        {/* Answer Questions Modal */}
        <AnswerQuestionsModal
          isOpen={showAnswerModal}
          onClose={() => setShowAnswerModal(false)}
          incident={selectedIncident}
          onUpdate={handleAnswersUpdated}
        />
      </div>
    </DashboardLayout>
  );
};

export default DriverIncidentsPage;
