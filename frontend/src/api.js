// API utility functions for Dora Travel Planner

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BACKEND_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Health check
export const checkHealth = async () => {
  return apiRequest('/api/health');
};

// Authentication API
export const registerUser = async (userData) => {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (userData) => {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const getCurrentUser = async (token) => {
  return apiRequest('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Trip preferences API
export const saveTripPreferences = async (preferences, token) => {
  return apiRequest('/api/trips/preferences', {
    method: 'POST',
    body: JSON.stringify(preferences),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// For demo purposes, we'll create a mock save function that doesn't require auth
export const saveTripPreferencesDemo = async (preferences) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate successful save
  return {
    trip_id: 'demo-' + Date.now(),
    message: 'Trip preferences saved successfully (demo mode)',
    preferences
  };
};