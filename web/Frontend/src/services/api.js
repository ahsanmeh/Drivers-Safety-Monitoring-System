const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('Making API call to:', fullUrl);
  console.log('Request config:', config);

  try {
    const response = await fetch(fullUrl, config);
    console.log('Response status:', response.status);

    let data;
    try {
      data = await response.json();
      console.log('Response data:', data);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return null;
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}: Something went wrong`;

      // Handle specific HTTP status codes
      switch (response.status) {
        case 401:
          // Unauthorized - only redirect if not already on login page
          // localStorage.removeItem('token');
          // localStorage.removeItem('user');
          // if (!window.location.pathname.includes('/login')) {
          //   window.location.href = '/login';
          // }
          throw new Error(errorMessage);
        case 403:
          throw new Error('Access denied. You do not have permission to perform this action.');
        case 404:
          throw new Error('The requested resource was not found.');
        case 422:
          // Validation errors
          const validationErrors = data.errors?.map(err => err.msg).join(', ') || errorMessage;
          throw new Error(`Validation failed: ${validationErrors}`);
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(errorMessage);
      }
    }

    return data;
  } catch (error) {
    console.error('API Error for endpoint:', endpoint, error);

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  login: async (credentials) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  refreshToken: async () => {
    return apiCall('/auth/refresh', {
      method: 'POST',
    });
  },

  verify2FA: async (userId, otpCode) => {
    return apiCall('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ userId, otpCode }),
    });
  },

  resend2FA: async (userId) => {
    return apiCall('/auth/resend-2fa', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  requestPasswordReset: async (email) => {
    return apiCall('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token, newPassword) => {
    return apiCall('/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// User Management APIs
export const userAPI = {
  getProfile: async () => {
    return apiCall('/auth/me');
  },

  updateProfile: async (userData) => {
    return apiCall('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('profileImage', file);

    const token = getAuthToken();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Profile Image Upload Error:', error);
      throw error;
    }
  },

  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/users${queryString ? `?${queryString}` : ''}`);
  },

  getAllDrivers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/users/drivers${queryString ? `?${queryString}` : ''}`);
  },

  getUserById: async (userId) => {
    return apiCall(`/users/${userId}`);
  },

  updateUser: async (userId, userData) => {
    return apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (userId) => {
    return apiCall(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Vehicle Management APIs
export const vehicleAPI = {
  getAllVehicles: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/vehicles${queryString ? `?${queryString}` : ''}`);
  },

  getVehicleById: async (vehicleId) => {
    return apiCall(`/vehicles/${vehicleId}`);
  },

  createVehicle: async (vehicleData) => {
    return apiCall('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  },

  updateVehicle: async (vehicleId, vehicleData) => {
    return apiCall(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  },

  deleteVehicle: async (vehicleId) => {
    return apiCall(`/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
  },

  getVehicleMaintenance: async (vehicleId) => {
    return apiCall(`/vehicles/${vehicleId}/maintenance`);
  },

  scheduleMaintenance: async (vehicleId, maintenanceData) => {
    return apiCall(`/vehicles/${vehicleId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    });
  },
};

// Trip Management APIs
export const tripAPI = {
  getAllTrips: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/trips${queryString ? `?${queryString}` : ''}`);
  },

  getTripById: async (tripId) => {
    return apiCall(`/trips/${tripId}`);
  },

  createTrip: async (tripData) => {
    return apiCall('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  },

  updateTrip: async (tripId, tripData) => {
    return apiCall(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  },

  deleteTrip: async (tripId) => {
    return apiCall(`/trips/${tripId}`, {
      method: 'DELETE',
    });
  },

  updateTripStatus: async (tripId, statusData) => {
    return apiCall(`/trips/${tripId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },

  // Legacy functions for backward compatibility
  startTrip: async (tripId) => {
    return apiCall(`/trips/${tripId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'in_progress' }),
    });
  },

  completeTrip: async (tripId, tripData) => {
    return apiCall(`/trips/${tripId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed', ...tripData }),
    });
  },

  getDriverTrips: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/trips${queryString ? `?${queryString}` : ''}`);
  },
};

// Incident Management APIs
export const incidentAPI = {
  getAllIncidents: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/incidents${queryString ? `?${queryString}` : ''}`);
  },

  getIncidentById: async (incidentId) => {
    return apiCall(`/incidents/${incidentId}`);
  },

  createIncident: async (incidentData) => {
    return apiCall('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  },

  updateIncident: async (incidentId, incidentData) => {
    return apiCall(`/incidents/${incidentId}`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
  },

  deleteIncident: async (incidentId) => {
    return apiCall(`/incidents/${incidentId}`, {
      method: 'DELETE',
    });
  },

  answerQuestions: async (incidentId, answersData) => {
    return apiCall(`/incidents/${incidentId}/answer-questions`, {
      method: 'PUT',
      body: JSON.stringify(answersData),
    });
  },

  resolveIncident: async (incidentId, resolutionData) => {
    // Use update API to change status to resolved
    const updateData = {
      status: 'resolved',
      ...resolutionData
    };
    return apiCall(`/incidents/${incidentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
};

// Reports & Analytics APIs
export const reportAPI = {
  getDashboardStats: async () => {
    return apiCall('/reports/dashboard');
  },

  getDriverPerformance: async () => {
    return apiCall('/reports/driver-performance');
  },

  generateReport: async (reportType, params = {}) => {
    return apiCall(`/reports/generate/${reportType}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

// Data Logs APIs
export const logAPI = {
  getActivityLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/logs/activity${queryString ? `?${queryString}` : ''}`);
  },

  getSystemLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/logs/system${queryString ? `?${queryString}` : ''}`);
  },

  getTripLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/logs/trips${queryString ? `?${queryString}` : ''}`);
  },

  getIncidentLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/logs/incidents${queryString ? `?${queryString}` : ''}`);
  },

  exportLogs: async (logType, params = {}) => {
    return apiCall(`/logs/export/${logType}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

// File Upload API
export const uploadAPI = {
  uploadFile: async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = getAuthToken();

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  },
};

const api = {
  auth: authAPI,
  user: userAPI,
  vehicle: vehicleAPI,
  trip: tripAPI,
  incident: incidentAPI,
  report: reportAPI,
  log: logAPI,
  upload: uploadAPI,
};

export default api;
