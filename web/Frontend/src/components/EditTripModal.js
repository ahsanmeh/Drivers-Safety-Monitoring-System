import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiCalendar, FiUser, FiTruck, FiMessageSquare } from 'react-icons/fi';
import { tripAPI, userAPI, vehicleAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const EditTripModal = ({ isOpen, onClose, trip, onTripUpdated }) => {
  const [formData, setFormData] = useState({
    assignedDriver: '',
    assignedVehicle: '',
    startLocation: {
      address: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    endLocation: {
      address: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
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

  useEffect(() => {
    if (isOpen && trip) {
      // Populate form with existing trip data
      setFormData({
        assignedDriver: trip.assignedDriver?._id || '',
        assignedVehicle: trip.assignedVehicle?._id || '',
        startLocation: {
          address: trip.startLocation?.address || '',
          coordinates: {
            latitude: trip.startLocation?.coordinates?.latitude?.toString() || '',
            longitude: trip.startLocation?.coordinates?.longitude?.toString() || ''
          }
        },
        endLocation: {
          address: trip.endLocation?.address || '',
          coordinates: {
            latitude: trip.endLocation?.coordinates?.latitude?.toString() || '',
            longitude: trip.endLocation?.coordinates?.longitude?.toString() || ''
          }
        },
        scheduledStartTime: trip.scheduledStartTime ? new Date(trip.scheduledStartTime).toISOString().slice(0, 16) : '',
        scheduledEndTime: trip.scheduledEndTime ? new Date(trip.scheduledEndTime).toISOString().slice(0, 16) : '',
        distance: trip.distance?.toString() || '',
        estimatedDuration: trip.estimatedDuration?.toString() || '',
        notes: trip.notes || ''
      });

      // Set location search queries
      setLocationSearch({
        startLocation: {
          query: trip.startLocation?.address || '',
          suggestions: [],
          showSuggestions: false,
          loading: false
        },
        endLocation: {
          query: trip.endLocation?.address || '',
          suggestions: [],
          showSuggestions: false,
          loading: false
        }
      });
    }
  }, [isOpen, trip]);

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      fetchVehicles();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
      
      // Frontend validation
      if (!formData.assignedDriver || !formData.assignedVehicle || !formData.startLocation.address || !formData.endLocation.address) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!formData.scheduledStartTime || !formData.scheduledEndTime) {
        toast.error('Please select scheduled start and end times');
        return;
      }

      if (parseFloat(formData.startLocation.coordinates.latitude) < -90 || parseFloat(formData.startLocation.coordinates.latitude) > 90) {
        toast.error('Invalid start latitude');
        return;
      }

      if (parseFloat(formData.startLocation.coordinates.longitude) < -180 || parseFloat(formData.startLocation.coordinates.longitude) > 180) {
        toast.error('Invalid start longitude');
        return;
      }

      if (parseFloat(formData.endLocation.coordinates.latitude) < -90 || parseFloat(formData.endLocation.coordinates.latitude) > 90) {
        toast.error('Invalid end latitude');
        return;
      }

      if (parseFloat(formData.endLocation.coordinates.longitude) < -180 || parseFloat(formData.endLocation.coordinates.longitude) > 180) {
        toast.error('Invalid end longitude');
        return;
      }

      // Convert form data to API format
      const tripData = {
        assignedDriver: formData.assignedDriver,
        assignedVehicle: formData.assignedVehicle,
        startLocation: {
          address: formData.startLocation.address,
          coordinates: {
            latitude: parseFloat(formData.startLocation.coordinates.latitude),
            longitude: parseFloat(formData.startLocation.coordinates.longitude)
          }
        },
        endLocation: {
          address: formData.endLocation.address,
          coordinates: {
            latitude: parseFloat(formData.endLocation.coordinates.latitude),
            longitude: parseFloat(formData.endLocation.coordinates.longitude)
          }
        },
        scheduledStartTime: new Date(formData.scheduledStartTime).toISOString(),
        scheduledEndTime: new Date(formData.scheduledEndTime).toISOString(),
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        notes: formData.notes || undefined
      };

      console.log('Updating trip with data:', tripData);

      const response = await tripAPI.updateTrip(trip._id, tripData);
      
      if (response.success) {
        toast.success('Trip updated successfully!');
        onTripUpdated(response.data.trip);
        onClose();
      } else {
        toast.error(response.message || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      
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
      assignedDriver: '',
      assignedVehicle: '',
      startLocation: {
        address: '',
        coordinates: {
          latitude: '',
          longitude: ''
        }
      },
      endLocation: {
        address: '',
        coordinates: {
          latitude: '',
          longitude: ''
        }
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.location-search-container')) {
        setLocationSearch(prev => ({
          startLocation: { ...prev.startLocation, showSuggestions: false },
          endLocation: { ...prev.endLocation, showSuggestions: false }
        }));
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!trip) return null;

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
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiMapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Edit Trip</h2>
                  <p className="text-gray-600">Update trip details and information</p>
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
              {/* Trip Assignment */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline w-4 h-4 mr-2" />
                    Assign Driver *
                  </label>
                  <select
                    name="assignedDriver"
                    value={formData.assignedDriver}
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
                    Assign Vehicle *
                  </label>
                  <select
                    name="assignedVehicle"
                    value={formData.assignedVehicle}
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

              {/* Locations */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative location-search-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="inline w-4 h-4 mr-2" />
                    Start Location *
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
                    
                    <button
                      type="button"
                      onClick={() => getCurrentLocation('startLocation')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-300 text-sm"
                      title="Use Current Location"
                    >
                      📍
                    </button>
                    
                    {locationSearch.startLocation.loading && (
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  
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
                    End Location *
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
                      placeholder="Search for end location..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <button
                      type="button"
                      onClick={() => getCurrentLocation('endLocation')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-300 text-sm"
                      title="Use Current Location"
                    >
                      📍
                    </button>
                    
                    {locationSearch.endLocation.loading && (
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  
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
                    Scheduled Start Time *
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
                    <FiCalendar className="inline w-4 h-4 mr-2" />
                    Scheduled End Time *
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

              {/* Trip Details */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km)
                    <span className="text-xs text-blue-600 ml-2">Auto-calculated from locations</span>
                  </label>
                  <input
                    type="number"
                    name="distance"
                    value={formData.distance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    placeholder="25.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (minutes)
                    <span className="text-xs text-blue-600 ml-2">Auto-calculated from distance</span>
                  </label>
                  <input
                    type="number"
                    name="estimatedDuration"
                    value={formData.estimatedDuration}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="240"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMessageSquare className="inline w-4 h-4 mr-2" />
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional notes or special instructions..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                    <span>Update Trip</span>
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

export default EditTripModal;
