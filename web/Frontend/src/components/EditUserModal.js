import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiMail, FiPhone, FiMapPin, FiShield } from 'react-icons/fi';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const EditUserModal = ({ isOpen, onClose, user: userToEdit, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    gender: '',
    role: 'driver',
    isActive: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userToEdit) {
      // Populate form with existing user data
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        phone: userToEdit.phone || '',
        address: userToEdit.address || '',
        licenseNumber: userToEdit.licenseNumber || '',
        gender: userToEdit.gender || '',
        role: userToEdit.role || 'driver',
        isActive: userToEdit.isActive !== undefined ? userToEdit.isActive : true
      });
    }
  }, [isOpen, userToEdit]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Frontend validation
      if (!formData.name || !formData.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.name.length < 2 || formData.name.length > 50) {
        toast.error('Name must be between 2 and 50 characters');
        return;
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      if (formData.phone && formData.phone.length > 15) {
        toast.error('Phone number cannot be more than 15 characters');
        return;
      }

      if (formData.address && formData.address.length > 200) {
        toast.error('Address cannot be more than 200 characters');
        return;
      }

      if (formData.licenseNumber && formData.licenseNumber.length > 20) {
        toast.error('License number cannot be more than 20 characters');
        return;
      }

      // Convert form data to API format
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        licenseNumber: formData.licenseNumber.trim() || undefined,
        gender: formData.gender || undefined,
        role: formData.role,
        isActive: formData.isActive
      };

      console.log('Updating user with data:', userData);

      const response = await userAPI.updateUser(userToEdit._id, userData);

      if (response.success) {
        toast.success('User updated successfully!');
        onUserUpdated(response.data.user);
        onClose();
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);

      if (error.response) {
        const { data } = error.response;
        if (data && data.errors) {
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
          toast.error(`Validation Error: ${errorMessages}`);
        } else if (data && data.message) {
          toast.error(data.message);
        } else {
          toast.error(`Server Error: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        toast.error('Network Error: Unable to connect to server');
      } else {
        toast.error(error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      licenseNumber: '',
      gender: '',
      role: 'driver',
      isActive: true
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!userToEdit) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {userToEdit.role === 'driver' ? 'View Driver Details' : 'Edit User'}
                  </h2>
                  <p className="text-gray-600">
                    {userToEdit.role === 'driver' ? 'Driver information and settings' : 'Update user information and settings'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    minLength="2"
                    maxLength="50"
                    placeholder="John Doe"
                    disabled={userToEdit.role === 'driver'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${userToEdit.role === 'driver' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline w-4 h-4 mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                    disabled={userToEdit.role === 'driver'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${userToEdit.role === 'driver' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiPhone className="inline w-4 h-4 mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength="15"
                    placeholder="+1234567890"
                    disabled={userToEdit.role === 'driver'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${userToEdit.role === 'driver' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={userToEdit.role === 'driver'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${userToEdit.role === 'driver' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Gender (Optional)</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMapPin className="inline w-4 h-4 mr-2" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  maxLength="200"
                  rows="3"
                  placeholder="123 Main St, City, State, Country"
                  disabled={userToEdit.role === 'driver'}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${userToEdit.role === 'driver' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.address.length}/200 characters
                </p>
              </div>

              {/* License Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiShield className="inline w-4 h-4 mr-2" />
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  maxLength="20"
                  placeholder="DL123456789"
                  disabled={userToEdit.role === 'driver'}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${userToEdit.role === 'driver' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
              </div>

              {/* Role and Status */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={userToEdit.role === 'driver'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${userToEdit.role === 'driver' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={userToEdit.role === 'driver'}
                      className={`w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${userToEdit.role === 'driver' ? 'cursor-not-allowed' : ''}`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active User
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                >
                  Cancel
                </button>
                {userToEdit.role !== 'driver' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update User</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditUserModal;
