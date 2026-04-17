import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import EditUserModal from '../components/EditUserModal';
import {
  FiHome,
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
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiCalendar,
  FiVideo
} from 'react-icons/fi';
import { userAPI } from '../services/api';

const getBackendUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
    }
    return `http://${window.location.hostname}:5000`;
};
const BACKEND_URL = getBackendUrl();

const UsersPage = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Only fetch data if user is admin
      if (parsedUser.role === 'admin') {
        fetchUsers();
        fetchDrivers();
      }
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await userAPI.getAllDrivers();
      if (response.success) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to fetch drivers');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await userAPI.deleteUser(userId);
        if (response.success) {
          toast.success('User deleted successfully!');
          setUsers(prev => prev.filter(user => user._id !== userId));
          setDrivers(prev => prev.filter(driver => driver._id !== userId));
        } else {
          toast.error(response.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus ? false : true;
      const response = await userAPI.updateUser(userId, { isActive: newStatus });
      if (response.success) {
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, isActive: newStatus } : user
        ));
        setDrivers(prev => prev.map(driver =>
          driver._id === userId ? { ...driver, isActive: newStatus } : driver
        ));
      } else {
        toast.error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setShowEditModal(true);
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers(prev => prev.map(userItem =>
      userItem._id === updatedUser._id ? updatedUser : userItem
    ));
    setDrivers(prev => prev.map(driver =>
      driver._id === updatedUser._id ? updatedUser : driver
    ));
    toast.success('User updated successfully!');
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role) => {
    return role === 'admin'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  const getDisplayData = () => {
    if (activeTab === 'drivers') {
      return drivers.filter(d => d.isActive);
    }
    return users;
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiUserX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      activePage="Users"
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
              <p className="text-gray-600">Manage users and drivers in your system</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { title: 'Total Drivers', value: drivers.length, icon: FiTruck, color: 'bg-purple-500' },
            { title: 'Active Drivers', value: drivers.filter(d => d.isActive).length, icon: FiUserCheck, color: 'bg-green-500' }
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

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'drivers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Drivers ({drivers.filter(d => d.isActive).length})
              </button>
            </nav>
          </div>

          {/* Users List */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {getDisplayData().map((userItem, index) => (
                  <motion.div
                    key={userItem._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center overflow-hidden">
                          {userItem.profileImage ? (
                            <img
                              src={
                                userItem.profileImage.startsWith('http')
                                  ? userItem.profileImage
                                  : userItem.profileImage.startsWith('/')
                                    ? `${BACKEND_URL}${userItem.profileImage}`
                                    : `${BACKEND_URL}/uploads/${userItem.profileImage}`
                              }
                              alt={userItem.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <FiUser className={`w-8 h-8 text-white ${userItem.profileImage ? 'hidden' : ''}`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{userItem.name}</h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <FiMail className="w-4 h-4 text-gray-500" />
                              <p className="text-gray-600 text-sm">{userItem.email}</p>
                            </div>
                            {userItem.phone && (
                              <div className="flex items-center space-x-1">
                                <FiPhone className="w-4 h-4 text-gray-500" />
                                <p className="text-gray-600 text-sm">{userItem.phone}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userItem.role)}`}>
                              {userItem.role.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(userItem.isActive)}`}>
                              {userItem.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                          {userItem.licenseNumber && (
                            <p className="text-sm text-gray-600 mt-1">
                              License: {userItem.licenseNumber}
                            </p>
                          )}
                          <div className="flex items-center space-x-1 mt-1">
                            <FiCalendar className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-600">
                              Joined: {new Date(userItem.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(userItem._id, userItem.isActive)}
                            className={`px-4 py-2 rounded-lg transition-colors duration-300 ${userItem.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                          >
                            {userItem.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-300"
                            title={userItem.role === 'driver' ? 'View Driver' : 'Edit User'}
                          >
                            {userItem.role === 'driver' ? <FiEye className="w-4 h-4" /> : <FiEdit className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem._id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {getDisplayData().length === 0 && (
                  <div className="text-center py-12">
                    <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No users found</p>
                    <p className="text-gray-500 mt-2">
                      {activeTab === 'drivers' ? 'No drivers registered yet' : 'No users in the system'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
