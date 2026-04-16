// Test API connectivity
export const testAPIConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('API Health Check Response:', data);
    return data;
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return { success: false, error: error.message };
  }
};

// Test with authentication
export const testAuthAPI = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('Testing Auth API with token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Auth API Response:', data);
    return data;
  } catch (error) {
    console.error('Auth API Test Failed:', error);
    return { success: false, error: error.message };
  }
};

