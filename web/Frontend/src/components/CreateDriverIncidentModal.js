import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiUser, FiTruck, FiAlertTriangle, FiFileText, FiShield, FiDollarSign } from 'react-icons/fi';
import { incidentAPI, tripAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const CreateDriverIncidentModal = ({ isOpen, onClose, onIncidentCreated }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    driver: '',
    vehicle: '',
    trip: '',
    incidentType: '',
    severity: '',
    location: {
      address: '',
      coordinates: { latitude: 0, longitude: 0 }
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

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [locationSearch, setLocationSearch] = useState({
    query: '',
    suggestions: [],
    showSuggestions: false,
    loading: false
  });

  // Enum values from API documentation
  const incidentTypes = [
    { value: 'smoke_detection', label: 'Smoke Detection' },
    { value: 'phone_usage', label: 'Phone Usage' },
    { value: 'drowsiness', label: 'Drowsiness' },
    { value: 'overspeeding', label: 'Overspeeding' },
    { value: 'harsh_brake', label: 'Harsh Brake' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  useEffect(() => {
    if (isOpen) {
      // Get current user from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
        setFormData(prev => ({ ...prev, driver: parsedUser._id }));
        fetchData(parsedUser._id);
      }
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.location-search-container')) {
        setLocationSearch(prev => ({
          ...prev,
          showSuggestions: false
        }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async (driverId) => {
    try {
      setLoadingData(true);
      // Fetch trips for the current driver
      const tripsResponse = await tripAPI.getAllTrips();
      
      if (tripsResponse.success) {
        // Filter trips for the current driver
        const driverTrips = tripsResponse.data.filter(trip => 
          trip.assignedDriver && trip.assignedDriver._id === driverId
        );
        setTrips(driverTrips);
        
        // Extract unique vehicles from driver's trips
        const tripVehicles = driverTrips.map(trip => trip.assignedVehicle).filter(Boolean);
        const uniqueVehicles = tripVehicles.filter((vehicle, index, self) => 
          index === self.findIndex(v => v._id === vehicle._id)
        );
        setVehicles(uniqueVehicles);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const searchLocations = async (query) => {
    if (!query.trim() || query.length < 3) {
      setLocationSearch(prev => ({
        ...prev,
        suggestions: [],
        showSuggestions: false
      }));
      return;
    }

    setLocationSearch(prev => ({
      ...prev,
      loading: true
    }));

    try {
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
          suggestions,
          showSuggestions: true,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocationSearch(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const selectLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      location: {
        address: location.display_name,
        coordinates: {
          latitude: location.lat,
          longitude: location.lon
        }
      }
    }));

    setLocationSearch(prev => ({
      ...prev,
      query: location.display_name,
      suggestions: [],
      showSuggestions: false
    }));
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.display_name || `${latitude}, ${longitude}`;
              
              setFormData(prev => ({
                ...prev,
                location: {
                  address: address,
                  coordinates: {
                    latitude: latitude,
                    longitude: longitude
                  }
                }
              }));

              setLocationSearch(prev => ({
                ...prev,
                query: address
              }));

              toast.success('Current location set successfully!');
            }
          } catch (error) {
            console.error('Error getting address:', error);
            // Still set coordinates even if address lookup fails
            setFormData(prev => ({
              ...prev,
              location: {
                address: `${latitude}, ${longitude}`,
                coordinates: {
                  latitude: latitude,
                  longitude: longitude
                }
              }
            }));
            toast.success('Current location coordinates set!');
          }
        },
        (error) => {
          toast.error('Could not get current location. Please enter manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation not supported. Please enter location manually.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'trip') {
      // When trip is selected, auto-select the vehicle for that trip
      const selectedTrip = trips.find(trip => trip._id === value);
      setFormData(prev => ({
        ...prev,
        trip: value,
        vehicle: selectedTrip ? selectedTrip.assignedVehicle._id : ''
      }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name.includes('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else if (name.includes('coordinates.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            ...prev.location.coordinates,
            [field]: parseFloat(value) || 0
          }
        }
      }));
    } else if (name.includes('damageDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        damageDetails: {
          ...prev.damageDetails,
          [field]: value
        }
      }));
    } else if (name.includes('policeReport.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        policeReport: {
          ...prev.policeReport,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.vehicle || !formData.incidentType || !formData.severity || !formData.location.address || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate coordinates
      const latitude = parseFloat(formData.location.coordinates.latitude);
      const longitude = parseFloat(formData.location.coordinates.longitude);
      
      if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
        toast.error('Please select a location from the search results');
        return;
      }

      // Convert form data to API format
      const incidentData = {
        driver: formData.driver,
        vehicle: formData.vehicle,
        trip: formData.trip || undefined, // Only include if not empty
        incidentType: formData.incidentType,
        severity: formData.severity,
        location: {
          address: formData.location.address,
          coordinates: {
            latitude: latitude,
            longitude: longitude
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

      // Debug: Log the payload being sent
      console.log('Incident payload being sent:', incidentData);

      const response = await incidentAPI.createIncident(incidentData);
      
      if (response.success) {
        toast.success('Incident reported successfully!');
        onIncidentCreated(response.data.incident);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error(error.message || 'Failed to report incident');
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
        coordinates: { latitude: '', longitude: '' }
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
    
    setLocationSearch({
      query: '',
      suggestions: [],
      showSuggestions: false,
      loading: false
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Report New Incident</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] relative">
              {loadingData ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FiAlertTriangle className="w-5 h-5 mr-2" />
                      Incident Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiUser className="inline w-4 h-4 mr-2" />
                          Driver
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                          {currentUser ? `${currentUser.name} (${currentUser.email})` : 'Loading...'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Current logged-in driver</p>
                      </div>

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
                          <option value="">Select a trip (optional)</option>
                          {trips.map(trip => (
                            <option key={trip._id} value={trip._id}>
                              {trip.tripNumber} - {trip.startLocation?.address} to {trip.endLocation?.address}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Selecting a trip will auto-select the vehicle</p>
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
                          <option value="">Select a vehicle</option>
                          {vehicles.map(vehicle => (
                            <option key={vehicle._id} value={vehicle._id}>
                              {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Vehicles from your assigned trips</p>
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
                          <option value="">Select incident type</option>
                          {incidentTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

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
                          <option value="">Select severity</option>
                          {severityLevels.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FiMapPin className="w-5 h-5 mr-2" />
                      Location Details
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Incident Location *
                        </label>
                        
                        <div className="relative location-search-container">
                          <input
                            type="text"
                            value={locationSearch.query}
                            onChange={(e) => {
                              const query = e.target.value;
                              setLocationSearch(prev => ({
                                ...prev,
                                query
                              }));
                              searchLocations(query);
                            }}
                            onFocus={() => {
                              if (locationSearch.suggestions.length > 0) {
                                setLocationSearch(prev => ({
                                  ...prev,
                                  showSuggestions: true
                                }));
                              }
                            }}
                            placeholder="Search for incident location..."
                            className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          
                          {/* Use Current Location Button */}
                          <button
                            type="button"
                            onClick={useCurrentLocation}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-300 text-sm"
                          >
                            📍
                          </button>
                          
                          {/* Loading Indicator */}
                          {locationSearch.loading && (
                            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            </div>
                          )}
                          
                          {/* Suggestions Dropdown */}
                          {locationSearch.showSuggestions && locationSearch.suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                              {locationSearch.suggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  onClick={() => selectLocation(suggestion)}
                                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 text-sm">
                                    {suggestion.display_name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Lat: {suggestion.lat.toFixed(6)}, Lon: {suggestion.lon.toFixed(6)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          Start typing to search for locations. Coordinates will be set automatically.
                        </p>
                      </div>

                      {/* Display Current Selection */}
                      {formData.location.address && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Location:</h4>
                          <p className="text-sm text-gray-900 mb-1">{formData.location.address}</p>
                          <p className="text-xs text-gray-500">
                            Coordinates: {formData.location.coordinates.latitude}, {formData.location.coordinates.longitude}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FiFileText className="w-5 h-5 mr-2" />
                      Description
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Incident Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        minLength="10"
                        maxLength="1000"
                        rows={4}
                        placeholder="Provide a detailed description of the incident (10-1000 characters)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.description.length}/1000 characters
                      </p>
                    </div>
                  </div>

                  {/* Witness Details */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FiUser className="w-5 h-5 mr-2" />
                      Witness Details (Optional)
                    </h3>
                    {formData.witnessDetails.map((witness, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-800">Witness {index + 1}</h4>
                          {formData.witnessDetails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWitness(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={witness.name}
                              onChange={(e) => handleWitnessChange(index, 'name', e.target.value)}
                              placeholder="Witness name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={witness.phone}
                              onChange={(e) => handleWitnessChange(index, 'phone', e.target.value)}
                              placeholder="+1234567890"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Statement
                            </label>
                            <textarea
                              value={witness.statement}
                              onChange={(e) => handleWitnessChange(index, 'statement', e.target.value)}
                              rows={2}
                              placeholder="Witness statement"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addWitness}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Another Witness
                    </button>
                  </div>

                  {/* Damage Details */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FiDollarSign className="w-5 h-5 mr-2" />
                      Damage Details (Optional)
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Damage
                        </label>
                        <textarea
                          name="damageDetails.vehicleDamage"
                          value={formData.damageDetails.vehicleDamage}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Describe vehicle damage"
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
                          rows={3}
                          placeholder="Describe cargo damage"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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
                    </div>
                  </div>

                  {/* Police Report */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FiShield className="w-5 h-5 mr-2" />
                      Police Report (Optional)
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          Police Station
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
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Reporting...</span>
                        </>
                      ) : (
                        <span>Report Incident</span>
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

export default CreateDriverIncidentModal;
