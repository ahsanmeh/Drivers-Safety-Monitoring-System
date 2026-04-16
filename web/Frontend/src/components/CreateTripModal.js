import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiUser, FiTruck, FiCalendar, FiClock } from 'react-icons/fi';
import { tripAPI, userAPI, vehicleAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const CreateTripModal = ({ isOpen, onClose, onTripCreated }) => {
  const [formData, setFormData] = useState({
    assignedDriver: '',
    assignedVehicle: '',
    startLocation: {
      address: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    endLocation: {
      address: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    scheduledStartTime: '',
    scheduledEndTime: '',
    distance: '',
    estimatedDuration: '',
    notes: ''
  });

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchDriversAndVehicles();
    }
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.location-search-container')) {
        setLocationSearch(prev => ({
          startLocation: { ...prev.startLocation, showSuggestions: false },
          endLocation: { ...prev.endLocation, showSuggestions: false }
        }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDriversAndVehicles = async () => {
    try {
      setLoadingData(true);
      const [driversResponse, vehiclesResponse] = await Promise.all([
        userAPI.getAllDrivers(),
        vehicleAPI.getAllVehicles()
      ]);

      if (driversResponse.success) {
        setDrivers(driversResponse.data);
      }
      if (vehiclesResponse.success) {
        setVehicles(vehiclesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load drivers and vehicles');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name.includes('startLocation.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        startLocation: {
          ...prev.startLocation,
          [field]: value
        }
      }));
    } else if (name.includes('endLocation.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        endLocation: {
          ...prev.endLocation,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const [locationSearch, setLocationSearch] = useState({
    startLocation: {
      query: '',
      suggestions: [],
      showSuggestions: false,
      loading: false
    },
    endLocation: {
      query: '',
      suggestions: [],
      showSuggestions: false,
      loading: false
    }
  });

  const searchLocations = async (query, locationType) => {
    if (!query.trim() || query.length < 3) {
      setLocationSearch(prev => ({
        ...prev,
        [locationType]: {
          ...prev[locationType],
          suggestions: [],
          showSuggestions: false
        }
      }));
      return;
    }

    try {
      setLocationSearch(prev => ({
        ...prev,
        [locationType]: {
          ...prev[locationType],
          loading: true
        }
      }));

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.map(item => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: item.address
        }));

        setLocationSearch(prev => ({
          ...prev,
          [locationType]: {
            ...prev[locationType],
            suggestions,
            showSuggestions: true,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSearch(prev => ({
        ...prev,
        [locationType]: {
          ...prev[locationType],
          loading: false,
          showSuggestions: false
        }
      }));
    }
  };

  // Function to calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Function to estimate duration based on distance (assuming average speed of 50 km/h in city)
  const estimateDuration = (distance) => {
    const averageSpeed = 50; // km/h
    const durationInHours = distance / averageSpeed;
    const durationInMinutes = Math.round(durationInHours * 60);
    return durationInMinutes;
  };

  // Function to auto-calculate distance and duration when both locations are set
  const autoCalculateDistanceAndDuration = (startCoords, endCoords) => {
    if (startCoords && endCoords && 
        startCoords.latitude && startCoords.longitude && 
        endCoords.latitude && endCoords.longitude) {
      
      const distance = calculateDistance(
        parseFloat(startCoords.latitude),
        parseFloat(startCoords.longitude),
        parseFloat(endCoords.latitude),
        parseFloat(endCoords.longitude)
      );
      
      const duration = estimateDuration(distance);
      
      setFormData(prev => ({
        ...prev,
        distance: distance.toString(),
        estimatedDuration: duration.toString()
      }));
    }
  };

  const selectLocation = (location, locationType) => {
    const newLocationData = {
      address: location.display_name,
      coordinates: {
        latitude: location.lat.toFixed(6),
        longitude: location.lon.toFixed(6)
      }
    };

    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        [locationType]: newLocationData
      };

      // Auto-calculate distance and duration if both locations are now set
      if (locationType === 'startLocation') {
        autoCalculateDistanceAndDuration(newLocationData.coordinates, prev.endLocation.coordinates);
      } else if (locationType === 'endLocation') {
        autoCalculateDistanceAndDuration(prev.startLocation.coordinates, newLocationData.coordinates);
      }

      return updatedFormData;
    });

    setLocationSearch(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        query: location.display_name,
        suggestions: [],
        showSuggestions: false
      }
    }));
  };

  const getCurrentLocation = (locationType) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Get address from coordinates (reverse geocoding)
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              const address = data.display_name || 'Current Location';
              const newLocationData = {
                address,
                coordinates: {
                  latitude: latitude.toFixed(6),
                  longitude: longitude.toFixed(6)
                }
              };
              
              setFormData(prev => {
                const updatedFormData = {
                  ...prev,
                  [locationType]: newLocationData
                };

                // Auto-calculate distance and duration if both locations are now set
                if (locationType === 'startLocation') {
                  autoCalculateDistanceAndDuration(newLocationData.coordinates, prev.endLocation.coordinates);
                } else if (locationType === 'endLocation') {
                  autoCalculateDistanceAndDuration(prev.startLocation.coordinates, newLocationData.coordinates);
                }

                return updatedFormData;
              });
              
              setLocationSearch(prev => ({
                ...prev,
                [locationType]: {
                  ...prev[locationType],
                  query: address
                }
              }));
              
              toast.success('Current location set!');
            })
            .catch(() => {
              // Fallback if reverse geocoding fails
              setFormData(prev => ({
                ...prev,
                [locationType]: {
                  address: 'Current Location',
                  coordinates: {
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6)
                  }
                }
              }));
              toast.success('Current location set!');
            });
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
      
      // Convert form data to API format
      const tripData = {
        ...formData,
        distance: parseFloat(formData.distance),
        estimatedDuration: parseInt(formData.estimatedDuration)
      };

      const response = await tripAPI.createTrip(tripData);
      
      if (response.success) {
        toast.success('Trip created successfully!');
        onTripCreated(response.data.trip);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error(error.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assignedDriver: '',
      assignedVehicle: '',
      startLocation: {
        address: '',
        coordinates: { latitude: 0, longitude: 0 }
      },
      endLocation: {
        address: '',
        coordinates: { latitude: 0, longitude: 0 }
      },
      scheduledStartTime: '',
      scheduledEndTime: '',
      distance: '',
      estimatedDuration: '',
      notes: ''
    });
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Create New Trip</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingData ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Driver and Vehicle Selection */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiUser className="inline w-4 h-4 mr-2" />
                        Assign Driver
                      </label>
                      <select
                        name="assignedDriver"
                        value={formData.assignedDriver}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a driver</option>
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
                        Assign Vehicle
                      </label>
                      <select
                        name="assignedVehicle"
                        value={formData.assignedVehicle}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a vehicle</option>
                        {vehicles.map(vehicle => (
                          <option key={vehicle._id} value={vehicle._id}>
                            {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative location-search-container">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiMapPin className="inline w-4 h-4 mr-2" />
                        Start Location
                      </label>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={locationSearch.startLocation.query}
                          onChange={(e) => {
                            const query = e.target.value;
                            setLocationSearch(prev => ({
                              ...prev,
                              startLocation: {
                                ...prev.startLocation,
                                query
                              }
                            }));
                            searchLocations(query, 'startLocation');
                          }}
                          onFocus={() => {
                            if (locationSearch.startLocation.suggestions.length > 0) {
                              setLocationSearch(prev => ({
                                ...prev,
                                startLocation: {
                                  ...prev.startLocation,
                                  showSuggestions: true
                                }
                              }));
                            }
                          }}
                          placeholder="Search for start location..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        {/* Current Location Button */}
                        <button
                          type="button"
                          onClick={() => getCurrentLocation('startLocation')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-300 text-sm"
                          title="Use Current Location"
                        >
                          📍
                        </button>
                        
                        {/* Loading Indicator */}
                        {locationSearch.startLocation.loading && (
                          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Suggestions Dropdown */}
                      {locationSearch.startLocation.showSuggestions && locationSearch.startLocation.suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {locationSearch.startLocation.suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => selectLocation(suggestion, 'startLocation')}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <p className="text-sm font-medium text-gray-900">{suggestion.display_name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative location-search-container">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiMapPin className="inline w-4 h-4 mr-2" />
                        End Location
                      </label>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={locationSearch.endLocation.query}
                          onChange={(e) => {
                            const query = e.target.value;
                            setLocationSearch(prev => ({
                              ...prev,
                              endLocation: {
                                ...prev.endLocation,
                                query
                              }
                            }));
                            searchLocations(query, 'endLocation');
                          }}
                          onFocus={() => {
                            if (locationSearch.endLocation.suggestions.length > 0) {
                              setLocationSearch(prev => ({
                                ...prev,
                                endLocation: {
                                  ...prev.endLocation,
                                  showSuggestions: true
                                }
                              }));
                            }
                          }}
                          placeholder="Search for destination..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        {/* Current Location Button */}
                        <button
                          type="button"
                          onClick={() => getCurrentLocation('endLocation')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-300 text-sm"
                          title="Use Current Location"
                        >
                          📍
                        </button>
                        
                        {/* Loading Indicator */}
                        {locationSearch.endLocation.loading && (
                          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Suggestions Dropdown */}
                      {locationSearch.endLocation.showSuggestions && locationSearch.endLocation.suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {locationSearch.endLocation.suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => selectLocation(suggestion, 'endLocation')}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <p className="text-sm font-medium text-gray-900">{suggestion.display_name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiCalendar className="inline w-4 h-4 mr-2" />
                        Scheduled Start Time
                      </label>
                      <input
                        type="datetime-local"
                        name="scheduledStartTime"
                        value={formData.scheduledStartTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiClock className="inline w-4 h-4 mr-2" />
                        Scheduled End Time
                      </label>
                      <input
                        type="datetime-local"
                        name="scheduledEndTime"
                        value={formData.scheduledEndTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Distance and Duration */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distance (km)
                      </label>
                      <input
                        type="number"
                        name="distance"
                        value={formData.distance}
                        onChange={handleInputChange}
                        required
                        step="0.1"
                        placeholder="25.5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Duration (minutes)
                      </label>
                      <input
                        type="number"
                        name="estimatedDuration"
                        value={formData.estimatedDuration}
                        onChange={handleInputChange}
                        required
                        placeholder="240"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Any additional notes or special instructions..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                        <span>Create Trip</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateTripModal;
