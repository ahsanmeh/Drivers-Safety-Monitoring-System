import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiBell, FiSettings, FiShield, FiSmartphone, FiMail,
    FiMonitor, FiDatabase, FiLock,
    FiAlertTriangle, FiEye, FiTruck, FiRefreshCw, FiSave
} from 'react-icons/fi';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const UserSettingsModal = ({ isOpen, onClose, user, onSettingsUpdated }) => {
    const [activeTab, setActiveTab] = useState('notifications');
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        notifications: {
            pushNotifications: true,
            emailAlerts: true,
            smsAlerts: false
        },
        system: {
            faceDetectionSensitivity: 'Medium',
            phoneDetectionSensitivity: 'High',
            smokeDetectionSensitivity: 'Medium',
            speedThreshold: 70,
            alertDelay: 3,
            dataRetentionDays: 90,
            videoQuality: 'High (1080p)',
            autoIncidentReporting: false
        },
        notificationAlerts: {
            realTimeAlerts: true,
            incidentNotifications: true,
            maintenanceReminders: false,
            reportGeneration: true,
            systemUpdates: false,
            emergencyAlerts: true
        },
        notificationChannels: {
            email: true,
            sms: false,
            push: true
        },
        security: {
            twoFactorEnabled: false,
            sessionTimeoutMinutes: 30,
            maxLoginAttempts: 5,
            passwordExpiryDays: 90
        }
    });

    useEffect(() => {
        if (isOpen && user && user.settings) {
            // Merge user settings with defaults
            setSettings(prev => ({
                notifications: { ...prev.notifications, ...(user.settings.notifications || {}) },
                system: { ...prev.system, ...(user.settings.system || {}) },
                notificationAlerts: { ...prev.notificationAlerts, ...(user.settings.notificationAlerts || {}) },
                notificationChannels: { ...prev.notificationChannels, ...(user.settings.notificationChannels || {}) },
                security: { ...prev.security, ...(user.settings.security || {}) }
            }));
        }
    }, [isOpen, user]);

    const handleSettingChange = (category, field, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Send only the settings object (partial update supported by backend)
            const response = await userAPI.updateProfile({ settings });

            if (response.success) {
                toast.success('Settings updated successfully!');
                if (onSettingsUpdated) {
                    onSettingsUpdated(response.data.user);
                }
                onClose();
            } else {
                toast.error(response.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error(error.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (user && user.settings) {
            setSettings({
                notifications: { ...user.settings.notifications || {} },
                system: { ...user.settings.system || {} },
                notificationAlerts: { ...user.settings.notificationAlerts || {} },
                notificationChannels: { ...user.settings.notificationChannels || {} },
                security: { ...user.settings.security || {} }
            });
        }
    };

    const tabs = [
        { id: 'system', label: 'System', icon: FiSettings },
        { id: 'notifications', label: 'Notifications', icon: FiBell },
        { id: 'security', label: 'Security', icon: FiShield }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                                <p className="text-gray-600 mt-1">Configure system preferences and account settings</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
                            >
                                <FiX className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 overflow-x-auto">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors duration-300 whitespace-nowrap ${activeTab === tab.id
                                                ? 'border-blue-600 text-blue-600 bg-blue-50'
                                                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* System Tab */}
                            {activeTab === 'system' && (
                                <div className="space-y-6 pb-4">
                                    {/* Detection Settings */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <FiMonitor className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800">Detection Settings</h3>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Face Detection Sensitivity</label>
                                                <select
                                                    value={settings.system.faceDetectionSensitivity}
                                                    onChange={(e) => handleSettingChange('system', 'faceDetectionSensitivity', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Detection Sensitivity</label>
                                                <select
                                                    value={settings.system.phoneDetectionSensitivity}
                                                    onChange={(e) => handleSettingChange('system', 'phoneDetectionSensitivity', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Smoke Detection Sensitivity</label>
                                                <select
                                                    value={settings.system.smokeDetectionSensitivity}
                                                    onChange={(e) => handleSettingChange('system', 'smokeDetectionSensitivity', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Speed Threshold (mph)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={settings.system.speedThreshold}
                                                    onChange={(e) => handleSettingChange('system', 'speedThreshold', parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Delay (seconds)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={settings.system.alertDelay}
                                                    onChange={(e) => handleSettingChange('system', 'alertDelay', parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Management */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <FiDatabase className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800">Data Management</h3>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention (days)</label>
                                                <select
                                                    value={settings.system.dataRetentionDays}
                                                    onChange={(e) => handleSettingChange('system', 'dataRetentionDays', parseInt(e.target.value))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={30}>30 days</option>
                                                    <option value={60}>60 days</option>
                                                    <option value={90}>90 days</option>
                                                    <option value={180}>180 days</option>
                                                    <option value={365}>365 days</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Video Quality</label>
                                                <select
                                                    value={settings.system.videoQuality}
                                                    onChange={(e) => handleSettingChange('system', 'videoQuality', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Low (720p)">Low (720p)</option>
                                                    <option value="Medium (1080p)">Medium (1080p)</option>
                                                    <option value="High (1080p)">High (1080p)</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-800">Auto Incident Reporting</p>
                                                        <p className="text-sm text-gray-500">Automatically generate incident reports</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.system.autoIncidentReporting}
                                                            onChange={(e) => handleSettingChange('system', 'autoIncidentReporting', e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6 pb-4">
                                    {/* Notification Preferences */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <FiBell className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">Push Notifications</p>
                                                    <p className="text-sm text-gray-500">Receive real-time alerts</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications.pushNotifications}
                                                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">Email Alerts</p>
                                                    <p className="text-sm text-gray-500">Get incident reports via email</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications.emailAlerts}
                                                        onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">SMS Alerts</p>
                                                    <p className="text-sm text-gray-500">Emergency notifications via SMS</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notifications.smsAlerts}
                                                        onChange={(e) => handleSettingChange('notifications', 'smsAlerts', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notification Configuration */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Notification Configuration</h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Alert Types */}
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-4">Alert Types</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <FiAlertTriangle className="w-5 h-5 text-red-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800">Real-time Alerts</p>
                                                                <p className="text-sm text-gray-500">Immediate safety notifications</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notificationAlerts.realTimeAlerts}
                                                                onChange={(e) => handleSettingChange('notificationAlerts', 'realTimeAlerts', e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <FiEye className="w-5 h-5 text-blue-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800">Incident Notifications</p>
                                                                <p className="text-sm text-gray-500">Driver behavior incidents</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notificationAlerts.incidentNotifications}
                                                                onChange={(e) => handleSettingChange('notificationAlerts', 'incidentNotifications', e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <FiTruck className="w-5 h-5 text-green-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800">Maintenance Reminders</p>
                                                                <p className="text-sm text-gray-500">Vehicle service notifications</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notificationAlerts.maintenanceReminders}
                                                                onChange={(e) => handleSettingChange('notificationAlerts', 'maintenanceReminders', e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* System Notifications */}
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-4">System Notifications</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <FiDatabase className="w-5 h-5 text-purple-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800">Report Generation</p>
                                                                <p className="text-sm text-gray-500">Automated report notifications</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notificationAlerts.reportGeneration}
                                                                onChange={(e) => handleSettingChange('notificationAlerts', 'reportGeneration', e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <FiSettings className="w-5 h-5 text-gray-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800">System Updates</p>
                                                                <p className="text-sm text-gray-500">Software update notifications</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notificationAlerts.systemUpdates}
                                                                onChange={(e) => handleSettingChange('notificationAlerts', 'systemUpdates', e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <FiAlertTriangle className="w-5 h-5 text-orange-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800">Emergency Alerts</p>
                                                                <p className="text-sm text-gray-500">Critical system notifications</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.notificationAlerts.emergencyAlerts}
                                                                onChange={(e) => handleSettingChange('notificationAlerts', 'emergencyAlerts', e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notification Channels */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Notification Channels</h3>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-500 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <FiMail className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notificationChannels.email}
                                                        onChange={(e) => handleSettingChange('notificationChannels', 'email', e.target.checked)}
                                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                                <p className="font-medium text-gray-800 mb-1">Email</p>
                                                <p className="text-sm text-gray-500">Receive detailed notifications via email</p>
                                            </div>
                                            <div className={`bg-white rounded-lg p-4 border-2 transition-colors ${settings.notificationChannels.sms ? 'border-green-500' : 'border-gray-200 hover:border-green-500'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <FiSmartphone className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notificationChannels.sms}
                                                        onChange={(e) => handleSettingChange('notificationChannels', 'sms', e.target.checked)}
                                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                    />
                                                </div>
                                                <p className="font-medium text-gray-800 mb-1">SMS</p>
                                                <p className="text-sm text-gray-500">Critical alerts sent via text message</p>
                                            </div>
                                            <div className={`bg-white rounded-lg p-4 border-2 transition-colors ${settings.notificationChannels.push ? 'border-purple-500' : 'border-gray-200 hover:border-purple-500'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                        <FiBell className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.notificationChannels.push}
                                                        onChange={(e) => handleSettingChange('notificationChannels', 'push', e.target.checked)}
                                                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                    />
                                                </div>
                                                <p className="font-medium text-gray-800 mb-1">Push</p>
                                                <p className="text-sm text-gray-500">Real-time browser notifications</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="space-y-6 pb-4">
                                    {/* Account Security */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <FiShield className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800">Account Security</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                                                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm text-gray-500">{settings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.security.twoFactorEnabled}
                                                            onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                                                <select
                                                    value={settings.security.sessionTimeoutMinutes}
                                                    onChange={(e) => handleSettingChange('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={15}>15 minutes</option>
                                                    <option value={30}>30 minutes</option>
                                                    <option value={60}>60 minutes</option>
                                                    <option value={120}>120 minutes</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                                                <select
                                                    value={settings.security.maxLoginAttempts}
                                                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={3}>3 attempts</option>
                                                    <option value={5}>5 attempts</option>
                                                    <option value={10}>10 attempts</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                                                <select
                                                    value={settings.security.passwordExpiryDays}
                                                    onChange={(e) => handleSettingChange('security', 'passwordExpiryDays', parseInt(e.target.value))}
                                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value={30}>30 days</option>
                                                    <option value={60}>60 days</option>
                                                    <option value={90}>90 days</option>
                                                    <option value={180}>180 days</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Security */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <FiLock className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800">Data Security</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">Access Logging</p>
                                                    <p className="text-sm text-gray-500">Log all user access and system activities</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={true}
                                                        disabled
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800">Data Encryption</p>
                                                    <p className="text-sm text-gray-500">Encrypt sensitive data at rest and in transit</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={true}
                                                        disabled
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Recommendations */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Recommendations</h3>
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                <span>Enable two-factor authentication for enhanced security</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                <span>Use strong passwords with a mix of characters</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                <span>Regularly review access logs for suspicious activity</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                <span>Keep session timeouts relatively short for shared devices</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300 flex items-center space-x-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                <span>Reset</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserSettingsModal;
