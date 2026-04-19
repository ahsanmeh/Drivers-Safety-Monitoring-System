export const API_BASE_URL = 'http://192.168.1.9:5000/api';
export const API_ROOT = API_BASE_URL.replace(/\/api$/, '');

export interface AuthPayload {
  user: any;
  token: string;
}

export interface FaceAuthPayload extends AuthPayload {
  similarity: number;
}

export async function faceLogin(imageUri: string): Promise<FaceAuthPayload> {
  const formData = new FormData();
  formData.append('faceImage', {
    uri: imageUri,
    name: 'face.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${API_BASE_URL}/auth/face-login`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Face login failed');
  }

  return json.data as FaceAuthPayload;
}

export async function manualLogin(email: string, password: string): Promise<AuthPayload> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Login failed');
  }

  return json.data as AuthPayload;
}

export interface IncidentResponse {
  incidents: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function fetchDriverIncidents(token: string, driverId: string): Promise<IncidentResponse> {
  const res = await fetch(`${API_BASE_URL}/incidents/driver/${driverId}?limit=100`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const json = await res.json();
  console.log('📡 API Response:', JSON.stringify(json, null, 2));

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch incidents');
  }

  // API returns data as array directly, not wrapped in 'incidents'
  return {
    incidents: json.data || [],
    pagination: json.pagination,
  };
}

export async function updateDrivingTime(token: string, seconds: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/update-driving-time`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ seconds }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update driving time');
  }

  return json.data;
}

export async function updateIncidentLocation(token: string, incidentId: string, location: { latitude: number; longitude: number; address?: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/location`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      location: {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        address: location.address || 'Updated from Driver App',
      },
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update incident location');
  }

  return json.data;
}

export async function updateProfile(token: string, data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update profile');
  }

  return json.data.user;
}

export async function uploadProfileImage(token: string, imageUri: string): Promise<any> {
  const formData = new FormData();
  formData.append('profileImage', {
    uri: imageUri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to upload profile image');
  }

  return json.data;
}

export async function incrementSafeTripCount(token: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/increment-safe-trip`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to increment safe trip count');
  }

  return json.data;
}

export async function monitorMobile(token: string, base64: string, location?: { latitude: number; longitude: number }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/monitor/mobile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ image: base64, location }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Mobile monitoring failed');
  }

  return json;
}

export async function dismissIncident(token: string, incidentId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/dismiss`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to dismiss incident');
  }

  return json;
}
