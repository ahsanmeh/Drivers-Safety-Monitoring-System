import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTruck, FiCalendar, FiShield, FiFileText, FiUser, FiWifi } from 'react-icons/fi';
import { vehicleAPI, userAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const CreateVehicleModal = ({ isOpen, onClose, onVehicleCreated }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    color: '',
    status: 'active',
    mileage: '',
    lastServiceDate: '',
    nextServiceDate: '',
    insuranceExpiry: '',
    registrationExpiry: '',
    assignedDriver: '',
    sensorMacAddress: ''
  });

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vinError, setVinError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      fetchDrivers();
    }
  }, [isOpen]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear VIN error when user starts typing
    if (name === 'vin' && vinError) {
      setVinError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Frontend validation
      if (!formData.make || !formData.model || !formData.year || !formData.licensePlate || !formData.vin || !formData.color || !formData.mileage) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.vin.length !== 17) {
        toast.error('VIN number must be exactly 17 characters');
        return;
      }

      if (parseInt(formData.year) < 1990 || parseInt(formData.year) > new Date().getFullYear() + 1) {
        toast.error('Please enter a valid year');
        return;
      }

      if (parseInt(formData.mileage) < 0) {
        toast.error('Mileage cannot be negative');
        return;
      }

      // Convert form data to API format
      const vehicleData = {
        ...formData,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage),
        lastServiceDate: formData.lastServiceDate ? new Date(formData.lastServiceDate).toISOString() : null,
        nextServiceDate: formData.nextServiceDate ? new Date(formData.nextServiceDate).toISOString() : null,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString() : null,
        registrationExpiry: formData.registrationExpiry ? new Date(formData.registrationExpiry).toISOString() : null,
        assignedDriver: formData.assignedDriver || null,
        sensorMacAddress: formData.sensorMacAddress || null
      };

      console.log('Creating vehicle with data:', vehicleData);

      const response = await vehicleAPI.createVehicle(vehicleData);

      if (response.success) {
        toast.success('Vehicle created successfully!');
        onVehicleCreated(response.data.vehicle);
        onClose();
        resetForm();
      } else {
        // Handle API error response
        if (response.message) {
          toast.error(response.message);
        } else {
          toast.error('Failed to create vehicle');
        }
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const { data } = error.response;
        if (data && data.errors) {
          // Handle validation errors
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');

          // Check for specific duplicate VIN error
          if (errorMessages.toLowerCase().includes('vin') &&
            (errorMessages.toLowerCase().includes('duplicate') ||
              errorMessages.toLowerCase().includes('already exists') ||
              errorMessages.toLowerCase().includes('unique'))) {
            setVinError('This VIN number already exists in the system');
            toast.error('❌ This VIN number already exists in the system. Please use a different VIN.');
          } else {
            toast.error(`Validation Error: ${errorMessages}`);
          }
        } else if (data && data.message) {
          // Check for duplicate VIN in general message
          if (data.message.toLowerCase().includes('vin') &&
            (data.message.toLowerCase().includes('duplicate') ||
              data.message.toLowerCase().includes('already exists') ||
              data.message.toLowerCase().includes('unique'))) {
            setVinError('This VIN number already exists in the system');
            toast.error('❌ This VIN number already exists in the system. Please use a different VIN.');
          } else {
            toast.error(data.message);
          }
        } else {
          toast.error(`Server Error: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        // Network error
        toast.error('Network Error: Unable to connect to server');
      } else {
        // Other errors
        toast.error(error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      vin: '',
      color: '',
      status: 'active',
      mileage: '',
      lastServiceDate: '',
      nextServiceDate: '',
      insuranceExpiry: '',
      registrationExpiry: '',
      assignedDriver: '',
      sensorMacAddress: ''
    });
    setVinError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Add New Vehicle</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FiTruck className="w-5 h-5 mr-2" />
                    Basic Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Make *
                      </label>
                      <input
                        type="text"
                        name="make"
                        value={formData.make}
                        onChange={handleInputChange}
                        required
                        placeholder="Toyota"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model *
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        required
                        placeholder="Camry"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        placeholder="2023"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${formData.year && (parseInt(formData.year) < 1900 || parseInt(formData.year) > new Date().getFullYear() + 1)
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                          }`}
                      />
                      {formData.year && (parseInt(formData.year) < 1900 || parseInt(formData.year) > new Date().getFullYear() + 1) && (
                        <p className="text-red-500 text-sm mt-1">Please enter a valid year between 1900 and {new Date().getFullYear() + 1}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Plate *
                      </label>
                      <input
                        type="text"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        required
                        placeholder="ABC-123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        VIN *
                      </label>
                      <input
                        type="text"
                        name="vin"
                        value={formData.vin}
                        onChange={handleInputChange}
                        required
                        maxLength="17"
                        placeholder="1HGBH41JXMN109186"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${vinError || (formData.vin && formData.vin.length !== 17)
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                          }`}
                      />
                      {vinError && (
                        <p className="text-red-500 text-sm mt-1">❌ {vinError}</p>
                      )}
                      {!vinError && formData.vin && formData.vin.length !== 17 && (
                        <p className="text-red-500 text-sm mt-1">VIN must be exactly 17 characters (current: {formData.vin.length})</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        placeholder="Silver"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned Driver
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                          name="assignedDriver"
                          value={formData.assignedDriver}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                          <option value="">Select Driver</option>
                          {drivers.map(driver => (
                            <option key={driver._id} value={driver._id}>
                              {driver.name} ({driver.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sensor MAC Address
                      </label>
                      <div className="relative">
                        <FiWifi className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="sensorMacAddress"
                          value={formData.sensorMacAddress}
                          onChange={handleInputChange}
                          placeholder="AA:BB:CC:DD:EE:FF"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Under Maintenance</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mileage (km)
                      </label>
                      <input
                        type="number"
                        name="mileage"
                        value={formData.mileage}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="15000"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${formData.mileage && parseInt(formData.mileage) < 0
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                          }`}
                      />
                      {formData.mileage && parseInt(formData.mileage) < 0 && (
                        <p className="text-red-500 text-sm mt-1">Mileage cannot be negative</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FiCalendar className="w-5 h-5 mr-2" />
                    Service Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Service Date
                      </label>
                      <input
                        type="date"
                        name="lastServiceDate"
                        value={formData.lastServiceDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Next Service Date
                      </label>
                      <input
                        type="date"
                        name="nextServiceDate"
                        value={formData.nextServiceDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Legal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FiShield className="w-5 h-5 mr-2" />
                    Legal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Expiry
                      </label>
                      <input
                        type="date"
                        name="insuranceExpiry"
                        value={formData.insuranceExpiry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Expiry
                      </label>
                      <input
                        type="date"
                        name="registrationExpiry"
                        value={formData.registrationExpiry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Vehicle</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateVehicleModal;
