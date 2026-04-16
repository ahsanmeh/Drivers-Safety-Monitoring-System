import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import PasswordExpiryAlert from '../components/PasswordExpiryAlert';
import ChangePasswordModal from '../components/ChangePasswordModal';
import {
    FiUser,
    FiClock,
    FiAlertTriangle,
    FiTruck,
    FiEdit3,
    FiSave,
    FiX,
    FiMail,
    FiPhone,
    FiCamera,
    FiBriefcase,
    FiSettings,
    FiUsers,
    FiDollarSign,
    FiVideo
} from 'react-icons/fi';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import UserSettingsModal from '../components/UserSettingsModal';

const BACKEND_URL = `http://${window.location.hostname}:5000`;

const AdminProfile = () => {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [dismissedExpiryWarning, setDismissedExpiryWarning] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        country: '',
        gender: '',
        zipCode: '',
        department: '',
        phone: ''
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
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            initializeFormData(parsedUser);
        }
        fetchUserProfile();
    }, []);

    const initializeFormData = (userData) => {
        // Split name into first and last name
        const nameParts = (userData.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Split address into country and zipCode
        const addressParts = (userData.address || '').split(',');
        const country = addressParts[0]?.trim() || '';
        const zipCode = addressParts.slice(1).join(',').trim() || '';

        setFormData({
            firstName,
            lastName,
            country,
            gender: userData.gender || '',
            zipCode,
            department: userData.department || '',
            phone: userData.phone || ''
        });
    };

    const fetchUserProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            if (response.success) {
                const updatedUser = response.data.user;
                setUser(updatedUser);
                initializeFormData(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast.error('Failed to fetch profile');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        try {
            // Prepare the data according to backend API structure
            const updateData = {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                phone: formData.phone,
                address: `${formData.country}, ${formData.zipCode}`.trim(),
                department: formData.department || undefined,
                gender: formData.gender || undefined // Only include if selected
            };

            const response = await userAPI.updateProfile(updateData);
            if (response.success) {
                setEditing(false);
                setUser(response.data.user);
                // Update localStorage
                localStorage.setItem('user', JSON.stringify(response.data.user));
                toast.success('Profile updated successfully!');
            } else {
                toast.error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        }
    };

    const handleSettingsUpdated = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        fetchUserProfile(); // Refresh to get latest data
    };

    const handlePasswordChanged = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowPasswordModal(false);
        fetchUserProfile(); // Refresh to get latest data
    };

    // Check if we should show expiry warning (not expired, just expiring soon)
    const showExpiringWarning = user?.passwordExpiryWarning &&
        !user?.passwordExpired &&
        !dismissedExpiryWarning;

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const response = await userAPI.uploadProfileImage(file);
            if (response.success) {
                toast.success('Profile image uploaded successfully!');
                fetchUserProfile(); // Refresh to get updated user data
            } else {
                toast.error(response.message || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <DashboardLayout
            user={user}
            activePage="Profile"
            navigationItems={navigationItems}
        >
            <div className="max-w-6xl mx-auto">
                {/* Password Expiry Alert */}
                {user && (
                    <PasswordExpiryAlert
                        user={user}
                        onDismiss={() => setDismissedExpiryWarning(true)}
                        onChangePassword={() => setShowPasswordModal(true)}
                        showExpiringWarning={showExpiringWarning}
                    />
                )}

                {/* Welcome Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    {/* Banner */}
                    <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl overflow-hidden relative flex items-center justify-center mb-8">
                        <div className="text-center text-white">
                            <h1 className="text-2xl font-bold">Welcome back, {user.name}</h1>
                            <p className="text-blue-100">Manage your profile and settings</p>
                        </div>
                    </div>

                    {/* Profile Picture and Info */}
                    <div className="flex items-center space-x-6 mb-8">
                        {/* Profile Picture */}
                        <div className="relative">
                            <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
                                {user.profileImage ? (
                                    <img
                                        src={
                                            user.profileImage.startsWith('http')
                                                ? user.profileImage
                                                : user.profileImage.startsWith('/')
                                                    ? `${BACKEND_URL}${user.profileImage}`
                                                    : `${BACKEND_URL}/uploads/${user.profileImage}`
                                        }
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to initials if image fails to load
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <span
                                    className={`text-4xl font-bold text-white ${user.profileImage ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>

                            {/* Upload Button */}
                            <label className="absolute bottom-2 right-2 w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-theme-primary-hover transition-colors duration-300 cursor-pointer">
                                {uploading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <FiCamera className="w-4 h-4" />
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-800">{user.name}</h2>
                                    <p className="text-gray-600">{user.email}</p>
                                    {user.department && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            <FiBriefcase className="inline w-4 h-4 mr-1" />
                                            {user.department}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">
                                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                            {user.role === 'admin' ? 'Administrator' : 'Driver'}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowSettingsModal(true)}
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg flex items-center space-x-2"
                                    >
                                        <FiSettings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setEditing(!editing)}
                                        className="px-6 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary-hover transition-colors duration-300 shadow-lg flex items-center space-x-2"
                                    >
                                        {editing ? <FiX className="w-4 h-4" /> : <FiEdit3 className="w-4 h-4" />}
                                        <span>{editing ? 'Cancel' : 'Edit'}</span>
                                    </motion.button>
                                    {editing && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-lg flex items-center space-x-2"
                                        >
                                            <FiSave className="w-4 h-4" />
                                            <span>Save</span>
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-xl p-8"
                >
                    {/* Personal Information Form */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Personal Information</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="Your First Name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="Country"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zip Code
                                    </label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="Zip Code"
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="Your Last Name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="Phone Number"
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
                                        disabled={!editing}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500"
                                    >
                                        <option value="">Select Gender (Optional)</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Department Row */}
                        <div className="mt-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    disabled={!editing}
                                    maxLength={100}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="Department"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Address Section */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">My Email Address</h3>

                        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center">
                                    <FiMail className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{user.email}</p>
                                    <p className="text-sm text-gray-500">Primary email address</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contacts Section */}
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Contacts</h3>

                        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center">
                                    <FiPhone className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{user.phone || 'No phone number'}</p>
                                    <p className="text-sm text-gray-500">Primary contact</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Settings Modal */}
            <UserSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                user={user}
                onSettingsUpdated={handleSettingsUpdated}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onPasswordChanged={handlePasswordChanged}
            />
        </DashboardLayout>
    );
};

export default AdminProfile;
