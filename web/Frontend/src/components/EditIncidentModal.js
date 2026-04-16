import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiMapPin, FiUser, FiTruck, FiMessageSquare, FiShield } from 'react-icons/fi';
import { incidentAPI, userAPI, vehicleAPI, tripAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const EditIncidentModal = ({ isOpen, onClose, incident, onIncidentUpdated }) => {
  const [formData, setFormData] = useState({
    driver: '',
    vehicle: '',
    trip: '',
    incidentType: '',
    severity: '',
    location: {
      address: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    description: '',
    witnessDetails: [
      {
        name: '',
        phone: '',
        statement: ''
      }
    ],
    damageDetails: {
      vehicleDamage: '',
      cargoDamage: '',
      estimatedCost: ''
    },
    policeReport: {
      reportNumber: '',
      officerName: '',
      station: ''
    }
  });

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const incidentTypes = [
    'accident', 'breakdown', 'traffic_violation', 'fuel_theft', 
    'cargo_damage', 'weather_related', 'mechanical_failure', 'other'
  ];

  const severityLevels = ['low', 'medium', 'high', 'critical'];

  useEffect(() => {
    if (isOpen && incident) {
      // Populate form with existing incident data
      setFormData({
        driver: incident.driver?._id || '',
        vehicle: incident.vehicle?._id || '',
        trip: incident.trip?._id || '',
        incidentType: incident.incidentType || '',
        severity: incident.severity || '',
        location: {
          address: incident.location?.address || '',
          coordinates: {
            latitude: incident.location?.coordinates?.latitude?.toString() || '',
            longitude: incident.location?.coordinates?.longitude?.toString() || ''
          }
        },
        description: incident.description || '',
        witnessDetails: incident.witnessDetails && incident.witnessDetails.length > 0 
          ? incident.witnessDetails 
          : [{ name: '', phone: '', statement: '' }],
        damageDetails: {
          vehicleDamage: incident.damageDetails?.vehicleDamage || '',
          cargoDamage: incident.damageDetails?.cargoDamage || '',
          estimatedCost: incident.damageDetails?.estimatedCost?.toString() || ''
        },
        policeReport: {
          reportNumber: incident.policeReport?.reportNumber || '',
          officerName: incident.policeReport?.officerName || '',
          station: incident.policeReport?.station || ''
        }
      });
    }
  }, [isOpen, incident]);

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      fetchVehicles();
      fetchTrips();
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
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getAllVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchTrips = async () => {
    try {
      const response = await tripAPI.getAllTrips();
      if (response.success) {
        setTrips(response.data);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      if (locationField === 'address') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: value
          }
        }));
      }
    } else if (name.startsWith('coordinates.')) {
      const coordField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            ...prev.location.coordinates,
            [coordField]: value
          }
        }
      }));
    } else if (name.startsWith('damageDetails.')) {
      const damageField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        damageDetails: {
          ...prev.damageDetails,
          [damageField]: value
        }
      }));
    } else if (name.startsWith('policeReport.')) {
      const policeField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        policeReport: {
          ...prev.policeReport,
          [policeField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleWitnessChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      witnessDetails: prev.witnessDetails.map((witness, i) => 
        i === index ? { ...witness, [field]: value } : witness
      )
    }));
  };

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnessDetails: [...prev.witnessDetails, { name: '', phone: '', statement: '' }]
    }));
  };

  const removeWitness = (index) => {
    setFormData(prev => ({
      ...prev,
      witnessDetails: prev.witnessDetails.filter((_, i) => i !== index)
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6)
              }
            }
          }));
          toast.success('Current location coordinates set!');
        },
        (error) => {
          toast.error('Could not get current location');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Frontend validation
      if (!formData.driver || !formData.vehicle || !formData.incidentType || !formData.severity || !formData.location.address || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (parseFloat(formData.location.coordinates.latitude) < -90 || parseFloat(formData.location.coordinates.latitude) > 90) {
        toast.error('Invalid latitude');
        return;
      }

      if (parseFloat(formData.location.coordinates.longitude) < -180 || parseFloat(formData.location.coordinates.longitude) > 180) {
        toast.error('Invalid longitude');
        return;
      }

      if (formData.description.length < 10) {
        toast.error('Description must be at least 10 characters long');
        return;
      }

      // Convert form data to API format
      const incidentData = {
        driver: formData.driver,
        vehicle: formData.vehicle,
        trip: formData.trip || undefined,
        incidentType: formData.incidentType,
        severity: formData.severity,
        location: {
          address: formData.location.address,
          coordinates: {
            latitude: parseFloat(formData.location.coordinates.latitude),
            longitude: parseFloat(formData.location.coordinates.longitude)
          }
        },
        description: formData.description,
        witnessDetails: formData.witnessDetails.filter(w => w.name.trim() !== ''),
        damageDetails: {
          vehicleDamage: formData.damageDetails.vehicleDamage || undefined,
          cargoDamage: formData.damageDetails.cargoDamage || undefined,
          estimatedCost: formData.damageDetails.estimatedCost ? parseFloat(formData.damageDetails.estimatedCost) : undefined
        },
        policeReport: {
          reportNumber: formData.policeReport.reportNumber || undefined,
          officerName: formData.policeReport.officerName || undefined,
          station: formData.policeReport.station || undefined
        }
      };

      console.log('Updating incident with data:', incidentData);

      const response = await incidentAPI.updateIncident(incident._id, incidentData);
      
      if (response.success) {
        toast.success('Incident updated successfully!');
        onIncidentUpdated(response.data.incident);
        onClose();
      } else {
        toast.error(response.message || 'Failed to update incident');
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      
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
      driver: '',
      vehicle: '',
      trip: '',
      incidentType: '',
      severity: '',
      location: {
        address: '',
        coordinates: {
          latitude: '',
          longitude: ''
        }
      },
      description: '',
      witnessDetails: [{ name: '', phone: '', statement: '' }],
      damageDetails: {
        vehicleDamage: '',
        cargoDamage: '',
        estimatedCost: ''
      },
      policeReport: {
        reportNumber: '',
        officerName: '',
        station: ''
      }
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!incident) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Edit Incident</h2>
                  <p className="text-gray-600">Update incident details and information</p>
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
                    Driver *
                  </label>
                  <select
                    name="driver"
                    value={formData.driver}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} ({driver.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiTruck className="inline w-4 h-4 mr-2" />
                    Vehicle *
                  </label>
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trip and Incident Type */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip (Optional)
                  </label>
                  <select
                    name="trip"
                    value={formData.trip}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Trip</option>
                    {trips.map(trip => (
                      <option key={trip._id} value={trip._id}>
                        {trip.tripNumber} - {trip.startLocation?.address?.split(',')[0]} → {trip.endLocation?.address?.split(',')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Type *
                  </label>
                  <select
                    name="incidentType"
                    value={formData.incidentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Incident Type</option>
                    {incidentTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity *
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Severity</option>
                  {severityLevels.map(level => (
                    <option key={level} value={level}>
                      {level.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="inline w-4 h-4 mr-2" />
                    Address *
                  </label>
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter incident location"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="inline w-4 h-4 mr-2" />
                    Coordinates
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="coordinates.latitude"
                      value={formData.location.coordinates.latitude}
                      onChange={handleInputChange}
                      step="any"
                      min="-90"
                      max="90"
                      placeholder="Latitude"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      name="coordinates.longitude"
                      value={formData.location.coordinates.longitude}
                      onChange={handleInputChange}
                      step="any"
                      min="-180"
                      max="180"
                      placeholder="Longitude"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-300"
                      title="Use Current Location"
                    >
                      📍
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMessageSquare className="inline w-4 h-4 mr-2" />
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  minLength="10"
                  maxLength="1000"
                  rows="4"
                  placeholder="Provide detailed description of the incident..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              {/* Witness Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Witness Details</h3>
                  <button
                    type="button"
                    onClick={addWitness}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-300"
                  >
                    Add Witness
                  </button>
                </div>
                {formData.witnessDetails.map((witness, index) => (
                  <div key={index} className="grid md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={witness.name}
                        onChange={(e) => handleWitnessChange(index, 'name', e.target.value)}
                        placeholder="Witness name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={witness.phone}
                        onChange={(e) => handleWitnessChange(index, 'phone', e.target.value)}
                        placeholder="Phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeWitness(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Statement</label>
                      <textarea
                        value={witness.statement}
                        onChange={(e) => handleWitnessChange(index, 'statement', e.target.value)}
                        rows="2"
                        placeholder="Witness statement..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Damage Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Damage
                  </label>
                  <textarea
                    name="damageDetails.vehicleDamage"
                    value={formData.damageDetails.vehicleDamage}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe vehicle damage..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo Damage
                  </label>
                  <textarea
                    name="damageDetails.cargoDamage"
                    value={formData.damageDetails.cargoDamage}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe cargo damage..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost
                </label>
                <input
                  type="number"
                  name="damageDetails.estimatedCost"
                  value={formData.damageDetails.estimatedCost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Police Report */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiShield className="inline w-4 h-4 mr-2" />
                    Report Number
                  </label>
                  <input
                    type="text"
                    name="policeReport.reportNumber"
                    value={formData.policeReport.reportNumber}
                    onChange={handleInputChange}
                    placeholder="PR123456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Officer Name
                  </label>
                  <input
                    type="text"
                    name="policeReport.officerName"
                    value={formData.policeReport.officerName}
                    onChange={handleInputChange}
                    placeholder="Officer Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Station
                  </label>
                  <input
                    type="text"
                    name="policeReport.station"
                    value={formData.policeReport.station}
                    onChange={handleInputChange}
                    placeholder="Central Police Station"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    <span>Update Incident</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditIncidentModal;
